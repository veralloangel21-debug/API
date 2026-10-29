export type Review = {
  rating: number;
  comment: string;
  date?: string;
  reviewerName?: string;
  reviewerEmail?: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  reviews?: Review[];
  thumbnail?: string;
  images?: string[];
  meta?: unknown;
  [key: string]: unknown;
};

export type ProductForm = {
  title: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  description: string;
};

export const emptyProductForm: ProductForm = {
  title: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};
