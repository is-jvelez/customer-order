export const REFRESH_TOKEN_KEY = 'orderflow_refresh_token';
export const DEFAULT_PAGE_SIZE = 15;
export const ORDER_STATUSES = ['Pending', 'InProgress', 'Completed', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Contrato CR-001: Low=1, Medium=2, High=3 (idéntico al enum App\Enums\OrderPriority de Laravel)
export enum OrderPriority {
  Low = 1,
  Medium = 2,
  High = 3,
}
export const ORDER_PRIORITIES: OrderPriority[] = [OrderPriority.Low, OrderPriority.Medium, OrderPriority.High];
export const DEFAULT_ORDER_PRIORITY = OrderPriority.Medium;
