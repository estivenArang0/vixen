export interface ImageCrop {
  url: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function parseImageCrop(raw: string): ImageCrop {
  const [url, cropData] = raw.split('::');
  if (cropData) {
    const [zoom, offsetX, offsetY] = cropData.split(',').map(Number);
    return { url, zoom: zoom || 100, offsetX: offsetX ?? 50, offsetY: offsetY ?? 50 };
  }
  return { url, zoom: 100, offsetX: 50, offsetY: 50 };
}

export function buildImageCrop(crop: ImageCrop): string {
  return `${crop.url}::${crop.zoom},${crop.offsetX},${crop.offsetY}`;
}