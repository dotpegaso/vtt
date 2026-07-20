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

    const channel = supabase
      .channel(`images:${roomId}:${Date.now()}`)
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

        const { error: insertError } = await supabase.rpc("insert_image", {
          p_room_id: roomId,
          p_storage_path: storagePath,
          p_x: x - scaledWidth / 2,
          p_y: y - scaledHeight / 2,
          p_width: scaledWidth,
          p_height: scaledHeight,
          p_uploaded_by: user.id,
        });

        if (insertError) {
          if (insertError.message.includes("image_limit_reached")) {
            console.error("Image limit reached (25 max)");
          } else {
            console.error("Failed to save image:", insertError);
          }
        }
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
    // Optimistic: reflect the new position locally immediately, don't wait
    // for the Supabase round-trip — this is what keeps the image and its
    // lock badge from visually snapping back to the old position after drag.
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, x, y, rotation } : img))
    );

    const supabase = createClient();
    await supabase.from("images").update({ x, y, rotation }).eq("id", imageId);
  }

  async function updateImageSize(
    imageId: string,
    width: number,
    height: number,
  ) {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, width, height } : img))
    );

    const supabase = createClient();
    await supabase.from("images").update({ width, height }).eq("id", imageId);
  }

  async function toggleImageLock(imageId: string, locked: boolean) {
    const supabase = createClient();
    const { error } = await supabase.rpc("toggle_image_lock", {
      p_image_id: imageId,
      p_locked: locked,
    });

    if (error) {
      console.error("Failed to toggle lock:", error);
    }
  }

  // add it to the returned object:
  return {
    images,
    isLoading,
    uploadImage,
    updateImagePosition,
    updateImageSize,
    toggleImageLock,
  };
}
