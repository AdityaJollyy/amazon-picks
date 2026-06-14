import { apiClient } from "./apiClient";

export type RestockStatus = "ACTIVE" | "PAUSED";

export type RestockItem = {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    imageUrl: string;
    price: number;
    mrp: number;
  };
  lastOrderedAt: string;
  intervalDays: number;
  dueAt: string;
  daysOverdue: number;
  suggestedQuantity: number;
  status: RestockStatus;
  snoozedUntil: string | null;
};

export type RestockReorderResult = {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    imageUrl: string;
    price: number;
    mrp: number;
    etaMinutes: number;
    stock: number;
    zoneCode: string;
  } | null;
  suggestedQuantity: number;
};

export const restockApi = {
  list: () => apiClient.get<RestockItem[]>("/restock"),
  reorder: (productId: string) =>
    apiClient.post<RestockReorderResult>(`/restock/${productId}/reorder`),
  skip: (productId: string) =>
    apiClient.post<unknown>(`/restock/${productId}/skip`),
  snooze: (productId: string, days: number) =>
    apiClient.post<unknown>(`/restock/${productId}/snooze`, { days }),
};
