import Cropper, {
  getInitialCropFromCroppedAreaPercentages,
  type Area,
  type MediaSize,
  type Point,
  type Size,
} from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const lastEmittedPosition = useRef<Point | null>(null);
  const isUserInteracting = useRef(false);
  const lastInternalState = useRef<{
    imageUrl: string;
    positionX: number;
    positionY: number;
    zoom: number;
  } | null>(null);

  const initialCroppedAreaPercentages = useMemo(() => {
    if (!mediaSize || !cropSize) {
      return null;
    }

    const cropWidth = Math.min(
      100,
      (cropSize.width / (mediaSize.width * zoom)) * 100,
    );
    const cropHeight = Math.min(
      100,
      (cropSize.height / (mediaSize.height * zoom)) * 100,
    );
    const x = clampCropStart(positionX - cropWidth / 2, cropWidth);
    const y = clampCropStart(positionY - cropHeight / 2, cropHeight);

    return { x, y, width: cropWidth, height: cropHeight };
  }, [cropSize, mediaSize, positionX, positionY, zoom]);

  useEffect(() => {
    lastEmittedPosition.current = null;
    isUserInteracting.current = false;
  }, [imageUrl]);

  useEffect(() => {
    if (!mediaSize || !cropSize || !initialCroppedAreaPercentages) {
      return;
    }

    const last = lastInternalState.current;
    const isFromInternalInteraction =
      last !== null &&
      last.imageUrl === imageUrl &&
      Math.abs(last.positionX - positionX) < 0.5 &&
      Math.abs(last.positionY - positionY) < 0.5 &&
      Math.abs(last.zoom - zoom) < 0.01;

    if (isFromInternalInteraction) {
      return;
    }

    const { crop: initialCrop } = getInitialCropFromCroppedAreaPercentages(
      initialCroppedAreaPercentages,
      mediaSize,
      0,
      cropSize,
      1,
      3,
    );

    lastEmittedPosition.current = { x: positionX, y: positionY };
    setCrop(initialCrop);
  }, [
    cropSize,
    imageUrl,
    initialCroppedAreaPercentages,
    mediaSize,
    positionX,
    positionY,
    zoom,
  ]);

  const handleCropAreaChange = (croppedArea: Area) => {
    if (!isUserInteracting.current) {
      return;
    }

    const nextX = clampPercent(croppedArea.x + croppedArea.width / 2);
    const nextY = clampPercent(croppedArea.y + croppedArea.height / 2);

    // Cropper may emit during layout updates; avoid feeding unchanged values
    // back into parent state to prevent maximum update depth loops.
    if (
      Math.abs(nextX - positionX) < 0.1 &&
      Math.abs(nextY - positionY) < 0.1
    ) {
      return;
    }

    const lastEmitted = lastEmittedPosition.current;
    if (
      lastEmitted &&
      Math.abs(nextX - lastEmitted.x) < 0.1 &&
      Math.abs(nextY - lastEmitted.y) < 0.1
    ) {
      return;
    }

    lastEmittedPosition.current = { x: nextX, y: nextY };
    lastInternalState.current = {
      imageUrl,
      positionX: nextX,
      positionY: nextY,
      zoom,
    };
    onPositionChange(nextX, nextY);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-md border border-stone-200 ${heightClassName}`}
    >
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        cropShape={aspect === 1 ? "round" : "rect"}
        showGrid={false}
        objectFit="cover"
        restrictPosition={true}
        onCropChange={setCrop}
        onZoomChange={(nextZoom) => {
          lastInternalState.current = {
            imageUrl,
            positionX,
            positionY,
            zoom: nextZoom,
          };
          onZoomChange(nextZoom);
        }}
        onCropAreaChange={handleCropAreaChange}
        onInteractionStart={() => {
          isUserInteracting.current = true;
        }}
        onInteractionEnd={() => {
          isUserInteracting.current = false;
        }}
        setMediaSize={setMediaSize}
        setCropSize={setCropSize}
      />
    </div>
  );
}
