"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

export type RemoteImage = {
  id: string;
  storage_path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  locked: boolean;
  uploaded_by: string;
};

type UseImagesProps = {
  roomId: string;
};

export function useImages({ roomId }: UseImagesProps) {
  const [images, setImages] = useState<RemoteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function setup() {
      // Load initial images
      const { data } = await supabase
        .from("images")
        .select("*")
        .eq("room_id", roomId)
        .order("z_index", { ascending: true });

      if (mounted && data) {
        setImages(data);
      }
      setIsLoading(false);
    }

    setup();

    // Separate effect for realtime subscription
    const channel = supabase
      .channel(`images:${roomId}:${Date.now()}`) // unique channel name each time
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "images",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (mounted) {
            setImages((prev) => [...prev, payload.new as RemoteImage]);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "images",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (mounted) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === payload.new.id ? (payload.new as RemoteImage) : img,
              ),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "images",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (mounted) {
            setImages((prev) =>
              prev.filter((img) => img.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId]);

  async function uploadImage(file: File, x: number, y: number) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("Not authenticated");
      return;
    }

    try {
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1500,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);

      const fileExt = compressed.name.split(".").pop();
      const fileName = `${Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}.${fileExt}`;
      const storagePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("room-images")
        .upload(storagePath, compressed);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("room-images")
        .getPublicUrl(storagePath);

      const img = new window.Image();
      img.onload = async () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;

        const maxWidth = window.innerWidth * 0.4;
        const scaledWidth = Math.min(width, maxWidth);
        const scaledHeight = scaledWidth / aspectRatio;

        await supabase.from("images").insert({
          room_id: roomId,
          storage_path: storagePath,
          x: x - scaledWidth / 2,
          y: y - scaledHeight / 2,
          width: scaledWidth,
          height: scaledHeight,
          uploaded_by: user.id,
        });
      };
      img.onerror = () => {
        console.error("Failed to load image dimensions");
      };
      img.src = urlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  }

  async function updateImagePosition(
    imageId: string,
    x: number,
    y: number,
    rotation: number,
  ) {
    const supabase = createClient();
    await supabase.from("images").update({ x, y, rotation }).eq("id", imageId);
  }

  async function updateImageSize(
    imageId: string,
    width: number,
    height: number,
  ) {
    const supabase = createClient();
    await supabase.from("images").update({ width, height }).eq("id", imageId);
  }

  return {
    images,
    isLoading,
    uploadImage,
    updateImagePosition,
    updateImageSize,
  };
}
