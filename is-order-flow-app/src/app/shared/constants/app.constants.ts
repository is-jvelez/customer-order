export const REFRESH_TOKEN_KEY = 'orderflow_refresh_token';
export const DEFAULT_PAGE_SIZE = 15;
export const ORDER_STATUSES = ['Pending', 'InProgress', 'Completed', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
