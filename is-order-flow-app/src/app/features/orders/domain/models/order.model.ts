import { OrderItem, CreateOrderItemRequest } from './order-item.model';
import { OrderStatus } from '../../../../shared/constants/app.constants';

export interface Order {
  id: number;
  customerId: number;
  customerName: string | null;
  status: OrderStatus;
  notes: string | null;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilterParams {
  page?: number;
  per_page?: number;
  status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface CreateOrderRequest {
  customerId: number;
  notes?: string | null;
  items: CreateOrderItemRequest[];
}
