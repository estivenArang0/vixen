export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface VariantDTO {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  originalPrice: number | null;
  discountPercentage: number | null;
  stock: number;
  reservedStock: number;
  images: string[];
  active: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  sortOrder: number;
  image: string | null;
  active: boolean;
  description: string;
  children: CategoryDTO[];
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  slug: string;
  brand: string;
  images: string[];
  rating: number | null;
  reviewCount: number | null;
  active: boolean;
  sku: string;
  tags: string[];
  specifications: string[];
  seo: SeoMetadata | null;
  weight: number | null;
  dimensions: Dimensions | null;
  attributes: Record<string, string> | null;
  minPrice: number | null;
  maxPrice: number | null;
}
