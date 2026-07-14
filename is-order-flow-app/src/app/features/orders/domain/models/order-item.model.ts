export interface OrderItem {
  id: number;
  orderId: number;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateOrderItemRequest {
  description: string;
  quantity: number;
  price: number;
}
