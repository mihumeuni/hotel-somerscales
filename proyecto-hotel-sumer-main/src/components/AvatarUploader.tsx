import { useCallback, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "./ui";
import { uploadAvatar } from "../types/preferences";

type Props = {
  onUploaded: () => void;
  onCancel: () => void;
};

const OUTPUT_SIZE = 256;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const canvasFromCrop = (
  img: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas no soportado"));

  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas vacío"))),
      "image/jpeg",
      0.85,
    );
  });
};

export const AvatarUploader = ({ onUploaded, onCancel }: Props) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Solo se aceptan JPEG o PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen original es muy grande (máx. 5 MB)");
      return;
    }
    setError(null);
    setImgSrc(await fileToDataUrl(file));
  }, []);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const newCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 90 },
        1,
        img.width,
        img.height,
      ),
      img.width,
      img.height,
    );
    setCrop(newCrop);
  };

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await canvasFromCrop(imgRef.current, completedCrop);
      await uploadAvatar(blob);
      onUploaded();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      const code = msg.match(/HTTP (\d+)/)?.[1];
      if (code === "413") setError("Imagen mayor a 2 MB después del recorte");
      else if (code === "415") setError("Formato no soportado");
      else setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!imgSrc && (
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={onSelectFile}
            className="sr-only"
          />
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-marine transition">
            <p className="text-sm font-semibold text-marine">Elegir imagen</p>
            <p className="text-xs text-slate-500 mt-1">JPEG o PNG · máx. 5 MB</p>
          </div>
        </label>
      )}

      {imgSrc && (
        <div className="flex flex-col items-center gap-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            keepSelection
          >
            <img
              src={imgSrc}
              alt="Recorta tu avatar"
              onLoad={onImageLoad}
              className="max-h-72 object-contain"
            />
          </ReactCrop>
          <p className="text-[11px] text-slate-500">
            Arrastra para ajustar · el resultado se guarda como 256×256.
          </p>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-5 py-2 text-sm text-slate-600 hover:text-marine font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !completedCrop}
        >
          {uploading ? "Subiendo…" : "Guardar avatar"}
        </Button>
      </div>
    </div>
  );
};

export default AvatarUploader;
