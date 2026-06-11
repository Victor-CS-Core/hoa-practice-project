import { useEffect, useMemo, useRef, useState } from "react";

interface FramedImageProps {
  src: string;
  alt: string;
  positionX: number;
  positionY: number;
  zoom: number;
  containerClassName?: string;
  imageClassName?: string;
}

interface Size {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function FramedImage({
  src,
  alt,
  positionX,
  positionY,
  zoom,
  containerClassName,
  imageClassName,
}: FramedImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<Size | null>(null);
  const [mediaSize, setMediaSize] = useState<Size | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (!containerSize || !mediaSize) {
      return null;
    }

    const baseScale = Math.max(
      containerSize.width / mediaSize.width,
      containerSize.height / mediaSize.height,
    );
    const displayWidth = mediaSize.width * baseScale * zoom;
    const displayHeight = mediaSize.height * baseScale * zoom;

    const focusX = (positionX / 100) * displayWidth;
    const focusY = (positionY / 100) * displayHeight;

    const unclampedLeft = containerSize.width / 2 - focusX;
    const unclampedTop = containerSize.height / 2 - focusY;

    const left = clamp(unclampedLeft, containerSize.width - displayWidth, 0);
    const top = clamp(unclampedTop, containerSize.height - displayHeight, 0);

    return {
      width: displayWidth,
      height: displayHeight,
      left,
      top,
    };
  }, [containerSize, mediaSize, positionX, positionY, zoom]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${containerClassName ?? ""}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(event) => {
          const target = event.currentTarget;
          setMediaSize({
            width: target.naturalWidth,
            height: target.naturalHeight,
          });
        }}
        className={`absolute max-w-none ${imageClassName ?? ""}`}
        style={
          geometry
            ? {
                width: `${geometry.width}px`,
                height: `${geometry.height}px`,
                left: `${geometry.left}px`,
                top: `${geometry.top}px`,
              }
            : {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${positionX}% ${positionY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                left: 0,
                top: 0,
              }
        }
      />
    </div>
  );
}
