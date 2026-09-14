import imageCompression from 'browser-image-compression';

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
}

export async function compressPhoto(file: File): Promise<CompressedImageResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // If already very small (< 150KB), just convert to dataUrl
  if (originalSizeKb < 150) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
    };
  }

  const options = {
    maxSizeMB: 0.35, // Max 350KB
    maxWidthOrHeight: 1280, // High enough for clear item inspection
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.75,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const compressedSizeKb = Math.round(compressedFile.size / 1024);
    const dataUrl = await fileToDataUrl(compressedFile);

    return {
      file: compressedFile,
      dataUrl,
      originalSizeKb,
      compressedSizeKb,
    };
  } catch (error) {
    console.warn('Image compression fallback to original:', error);
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
    };
  }
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
