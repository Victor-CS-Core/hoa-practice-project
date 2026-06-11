import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useMemo, useState } from "react";

interface ImageCropEditorProps {
  imageUrl: string;
  aspect: number;
  positionX: number;
  positionY: number;
  zoom: number;
  heightClassName: string;
  onPositionChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const clampCropStart = (value: number, size: number) =>
  Math.max(0, Math.min(100 - size, value));

export function ImageCropEditor({
  imageUrl,
  aspect,
  positionX,
  positionY,
  zoom,
  heightClassName,
  onPositionChange,
  onZoomChange,
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });

  const initialCroppedAreaPercentages = useMemo(() => {
    const cropWidth = 100 / zoom;
    const cropHeight = 100 / zoom;
    const x = clampCropStart(positionX - cropWidth / 2, cropWidth);
    const y = clampCropStart(positionY - cropHeight / 2, cropHeight);

    return { x, y, width: cropWidth, height: cropHeight };
  }, [positionX, positionY, zoom]);

  const handleCropAreaChange = (croppedArea: Area) => {
    const nextX = clampPercent(croppedArea.x + croppedArea.width / 2);
    const nextY = clampPercent(croppedArea.y + croppedArea.height / 2);
    onPositionChange(nextX, nextY);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-md border border-stone-200 ${heightClassName}`}>
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        cropShape={aspect === 1 ? "round" : "rect"}
        showGrid={false}
        objectFit="cover"
        initialCroppedAreaPercentages={initialCroppedAreaPercentages}
        restrictPosition={false}
        onCropChange={setCrop}
        onZoomChange={onZoomChange}
        onCropAreaChange={handleCropAreaChange}
      />
    </div>
  );
}
