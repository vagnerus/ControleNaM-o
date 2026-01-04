import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages: ImagePlaceholder[] = data.placeholderImages;

export function getPlaceholderImage(idOrName: string): ImagePlaceholder | undefined {
  if (!idOrName) return undefined;
  
  return placeholderImages.find(img => 
    img.id === idOrName || 
    img.description.toLowerCase() === idOrName.toLowerCase() ||
    idOrName.toLowerCase().includes(img.description.toLowerCase())
  );
}
