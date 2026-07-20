"use client";

import { useEffect, useRef, useState } from "react";
import { Layer, Image as KonvaImage, Transformer, Rect, Group, Path } from "react-konva";
import type Konva from "konva";
import { createClient } from "@/lib/supabase/client";
import type { RemoteImage } from "@/hooks/useImages";
import { useImages } from "@/hooks/useImages";
import { theme } from "@/lib/theme";

type ImageLayerProps = {
  images: RemoteImage[];
  active: boolean;
  roomId: string;
  isGm: boolean;
};

export function ImageLayer({ images, active, roomId, isGm }: ImageLayerProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedImageRef = useRef<Konva.Image>(null);

  const { updateImagePosition, updateImageSize, toggleImageLock } = useImages({ roomId });

  function getImageUrl(storagePath: string): string {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("room-images")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

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

  useEffect(() => {
    if (selectedImageId && transformerRef.current && selectedImageRef.current) {
      transformerRef.current.nodes([selectedImageRef.current]);
    }
  }, [selectedImageId]);

  function handleImageClick(imageId: string) {
    if (!active) return;
    setSelectedImageId(imageId);
  }

  function handleLockToggle(image: RemoteImage) {
    if (!isGm) return;
    toggleImageLock(image.id, !image.locked);
    if (!image.locked) {
      // Locking an image the GM currently has selected — deselect so the
      // Transformer handles don't linger on a now-frozen image.
      setSelectedImageId(null);
    }
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

  const selectedImage = images.find((i) => i.id === selectedImageId);

  return (
    <Layer listening={active}>
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

        // Locked images can't be selected or dragged by anyone, GM included —
        // the GM must tap the lock badge to unlock first.
        const canInteract = active && !image.locked;
        const showBadge = (image.locked || (isGm && isSelected)) && draggingImageId !== image.id;

        return (
          <Group key={image.id}>
            <KonvaImage
              ref={isSelected ? selectedImageRef : null}
              image={loadedImg}
              x={image.x}
              y={image.y}
              width={image.width}
              height={image.height}
              rotation={image.rotation}
              draggable={isSelected && canInteract}
              onClick={() => canInteract && handleImageClick(image.id)}
              onTap={() => canInteract && handleImageClick(image.id)}
              onDragStart={() => setDraggingImageId(image.id)}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                handleDragEnd(image.id, e);
                // Small delay before letting the badge reappear, so it doesn't flash
                // at the old position before the image's own position has settled.
                setTimeout(() => setDraggingImageId(null), 500);
              }}
            />

            {showBadge && (
              <Group
                x={image.x + image.width + 4}
                y={image.y - 14}
                onClick={() => handleLockToggle(image)}
                onTap={() => handleLockToggle(image)}
              >
                <Rect width={20} height={20} fill="transparent" />
                <Group x={4} y={3}>
                  {image.locked ? (
                    <Path
                      data="M6 0a4 4 0 0 0-4 4v2H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4V4a2 2 0 1 1 4 0v1a1 1 0 1 0 2 0V4a4 4 0 0 0-4-4Z"
                      fill={theme.highlight}
                    />
                  ) : (
                    <Path
                      data="M6 0a4 4 0 0 0-4 4v2H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4V4a2 2 0 0 1 3.87-.74.75.75 0 1 0 1.38-.58A3.98 3.98 0 0 0 6 0Z"
                      fill={theme.container}
                      stroke={theme.divider}
                      strokeWidth={0.5}
                    />
                  )}
                </Group>
              </Group>
            )}
          </Group>
        );
      })}

      {selectedImageId && active && selectedImage && !selectedImage.locked && (
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
