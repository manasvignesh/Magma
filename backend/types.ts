// ============================================
// Shared TypeScript interfaces for the STYLE pipeline
// ============================================

export interface BodyAnalysis {
  bodyType: string;
  physiqueAnalysis: string;
  skinTone: string;
  faceStructure: string;
  vibe: string;
  bestColors: string[];
  recommendedFits: string[];
  avoid: string[];
  fashionInspiration: string[];
}

export interface Outfit {
  title: string;
  topwear: string;
  bottomwear: string;
  footwear: string;
  accessories: string[];
  layering: string;
  keywords: string[];
  imagePrompt?: string;
}

export interface Product {
  title: string;
  image: string;
  price: string;
  store: string;
  link: string;
}

export interface PipelineResult {
  analysis: BodyAnalysis;
  outfits: Outfit[];
  products: Record<string, Product[]>;
}

export type PipelineStage =
  | 'uploading_photo'
  | 'analyzing_body'
  | 'understanding_style'
  | 'generating_outfits'
  | 'searching_products'
  | 'completed'
  | 'error';

export interface SSEEvent {
  stage: PipelineStage;
  message: string;
  data?: Partial<PipelineResult>;
  error?: string;
}
