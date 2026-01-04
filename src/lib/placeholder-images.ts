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
  
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const search = normalize(idOrName);

  // 1. Exact ID match
  const byId = placeholderImages.find(img => img.id === idOrName);
  if (byId) return byId;

  // 2. Exact or partial description match
  const byDesc = placeholderImages.find(img => {
    const desc = normalize(img.description);
    return desc === search || search.includes(desc) || desc.includes(search);
  });
  if (byDesc) return byDesc;

  // 3. Keyword matching (e.g., "faculdade", "carro", "casa")
  const keywords: Record<string, string> = {
    "facul": "goal-education",
    "estudo": "goal-education",
    "formatura": "goal-education",
    "carro": "goal-car",
    "veiculo": "goal-car",
    "casa": "goal-house",
    "lar": "goal-house",
    "moradia": "goal-house",
    "viagem": "goal-travel",
    "ferias": "goal-travel",
    "reserva": "goal-emergency-fund",
    "emergencia": "goal-emergency-fund",
  };

  for (const [key, id] of Object.entries(keywords)) {
    if (search.includes(key)) {
      return placeholderImages.find(img => img.id === id);
    }
  }

  return undefined;
}
