import { apiClient } from "./apiClient";
import type {
  Category,
  ProductDetail,
  ProductListResponse,
  Zone,
} from "@/types/product";

export type ListProductsQuery = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  zoneCode?: string;
  search?: string;
};

export const productsApi = {
  list: (query: ListProductsQuery = {}) =>
    apiClient.get<ProductListResponse>("/products", { query }),
  get: (id: string) => apiClient.get<ProductDetail>(`/products/${id}`),
};

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories"),
};

export const zonesApi = {
  list: () => apiClient.get<Zone[]>("/zones"),
};
