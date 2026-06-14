import { apiClient } from "./apiClient";

/** Mirror of backend Prisma Order with included relations (post-unwrap). */
export type OrderStatus =
  | "PLACED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  zoneId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
  zone: {
    id: string;
    name: string;
    code: string;
    city: string;
    pincode: string;
  };
};

export type CreateOrderInput = {
  items: Array<{ productId: string; quantity: number }>;
  zoneCode: string;
};

export const ordersApi = {
  create: (input: CreateOrderInput) => apiClient.post<Order>("/orders", input),
  list: () => apiClient.get<Order[]>("/orders"),
  get: (id: string) => apiClient.get<Order>(`/orders/${id}`),
};
