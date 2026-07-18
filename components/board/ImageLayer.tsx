"use client";

import { useEffect, useRef, useState } from "react";
import { Layer, Image as KonvaImage, Transformer, Rect } from "react-konva";
import type Konva from "konva";
import { createClient } from "@/lib/supabase/client";
import type { RemoteImage } from "@/hooks/useImages";
import { useImages } from "@/hooks/useImages";

type ImageLayerProps = {
  images: RemoteImage[];
  active: boolean;
  roomId: string;
};

export function ImageLayer({ images, active, roomId }: ImageLayerProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedImageRef = useRef<Konva.Image>(null);

  const { updateImagePosition, updateImageSize } = useImages({ roomId });

  function getImageUrl(storagePath: string): string {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("room-images")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  // Preload each image whenever the images array changes (new upload, etc.)
  useEffect(() => {
    images.forEach((image) => {
      if (loadedImages[image.id]) return;

      const url = getImageUrl(image.storage_path);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [image.id]: img }));
      };
      img.onerror = () => {
        console.error("Failed to load image:", image.storage_path);
      };
      img.src = url;
    });
  }, [images, loadedImages]);

  // Attach transformer to selected image when selection changes
  useEffect(() => {
    if (selectedImageId && transformerRef.current && selectedImageRef.current) {
      transformerRef.current.nodes([selectedImageRef.current]);
    }
  }, [selectedImageId]);

  function handleImageClick(imageId: string) {
    if (!active) return;
    setSelectedImageId(imageId);
  }

  async function handleTransformEnd() {
    if (!selectedImageRef.current || !selectedImageId) return;

    const node = selectedImageRef.current;
    const x = node.x();
    const y = node.y();
    const width = Math.max(10, node.width() * node.scaleX());
    const height = Math.max(10, node.height() * node.scaleY());
    const rotation = node.rotation();

    node.scaleX(1);
    node.scaleY(1);

    await updateImagePosition(selectedImageId, x, y, rotation);
    await updateImageSize(selectedImageId, width, height);
  }

  async function handleDragEnd(
    imageId: string,
    e: Konva.KonvaEventObject<DragEvent>,
  ) {
    const node = e.target;
    await updateImagePosition(imageId, node.x(), node.y(), node.rotation());
  }

  return (
    <Layer
      listening={active}
    >
      <Rect
        x={-5000}
        y={-5000}
        width={10000}
        height={10000}
        fill="transparent"
        onClick={() => setSelectedImageId(null)}
        onTap={() => setSelectedImageId(null)}
      />

      {images.map((image) => {
        const isSelected = image.id === selectedImageId;
        const loadedImg = loadedImages[image.id];

        if (!loadedImg) return null;

        return (
          <KonvaImage
            key={image.id}
            ref={isSelected ? selectedImageRef : null}
            image={loadedImg}
            x={image.x}
            y={image.y}
            width={image.width}
            height={image.height}
            rotation={image.rotation}
            draggable={active}
            onClick={() => handleImageClick(image.id)}
            onTap={() => handleImageClick(image.id)}
            onDragEnd={(e) => {
              // Redundant with the Stage-side guard in BoardStage, but cheap
              // insurance: stops this event from bubbling to the Stage at all.
              e.cancelBubble = true;
              handleDragEnd(image.id, e);
            }}
          />
        );
      })}

      {selectedImageId && active && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Layer>
  );
}
