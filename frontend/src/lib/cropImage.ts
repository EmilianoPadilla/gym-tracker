export type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Given a source image and a pixel crop region (from react-easy-crop's
 * onCropComplete), draws just that region onto a canvas at a fixed output
 * size and returns it as a JPEG data URL - keeping profile pictures small
 * since they're stored directly as text in the database.
 */
export async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: PixelCrop,
  outputSize = 300
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}
