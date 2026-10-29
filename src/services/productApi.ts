import type { Product } from "../types/product";

const API_URL = "https://dummyjson.com/products";

async function apiRequest<T>(
  url: string,
  options?: Parameters<typeof fetch>[1]
): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function getProducts(): Promise<Product[]> {
  const data = await apiRequest<{ products: Product[] }>(
    `${API_URL}?limit=100`
  );

  return data.products;
}

export function getProduct(id: number): Promise<Product> {
  return apiRequest<Product>(`${API_URL}/${id}`);
}

export function createProduct(
  product: Omit<Product, "id">
): Promise<Product> {
  return apiRequest<Product>(`${API_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });
}

export function updateProduct(
  id: number,
  changes: Partial<Product>
): Promise<Product> {
  return apiRequest<Product>(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });
}

export function deleteProduct(id: number): Promise<Product> {
  return apiRequest<Product>(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
