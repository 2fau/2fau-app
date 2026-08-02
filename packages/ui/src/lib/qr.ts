import jsQR from "jsqr";

/** Decode a QR code from an already-decoded bitmap. Browser-only (uses canvas). */
function decodeBitmap(bitmap: ImageBitmap): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height)?.data ?? null;
}

/** Decode a QR code from an image file, returning its text (an otpauth:// URI)
 * or null if none is found. Browser-only (uses canvas). */
export async function decodeQrImage(file: File): Promise<string | null> {
  return decodeBitmap(await createImageBitmap(file));
}

/** Decode a QR code from a data: URL (e.g. a captured tab screenshot). */
export async function decodeQrDataUrl(dataUrl: string): Promise<string | null> {
  const blob = await (await fetch(dataUrl)).blob();
  return decodeBitmap(await createImageBitmap(blob));
}

/** A crop rectangle in the source image's own pixel space. */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Decode a QR code from a sub-rectangle of a data: URL, cropping to `rect`
 * before scanning. Uses OffscreenCanvas, so it runs in a service worker (no
 * `document`) as well as a page — the extension decodes region scans in the
 * background. Coordinates are in the image's pixel space (screenshots are at
 * `devicePixelRatio`, so scale CSS coordinates by it first). */
export async function decodeQrRegion(
  dataUrl: string,
  rect: PixelRect,
): Promise<string | null> {
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, rect.x, rect.y, w, h, 0, 0, w, h);
  const { data, width, height } = ctx.getImageData(0, 0, w, h);
  return jsQR(data, width, height)?.data ?? null;
}
