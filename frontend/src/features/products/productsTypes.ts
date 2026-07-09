export interface ProductVariant {
  color: string;
  price?: number;
  images: string[];
  sizes: Record<string, number>;
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  images: string[];
  variants: ProductVariant[];
  brand: string;
  rating: number | null;
  reviewCount: number | null;
  active: boolean;
  sku: string;
  tags: string[];
  specifications: string[];
}