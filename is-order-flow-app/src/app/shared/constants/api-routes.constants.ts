import { environment } from '../../../environments/environment';

export const AUTH_ROUTES = {
  LOGIN: `${environment.authServiceUrl}/auth/login`,
  REGISTER: `${environment.authServiceUrl}/auth/register`,
  REFRESH_TOKEN: `${environment.authServiceUrl}/auth/refresh-token`,
  REVOKE_TOKEN: `${environment.authServiceUrl}/auth/revoke-token`,
  ME: `${environment.authServiceUrl}/auth/me`,
} as const;

export const CUSTOMER_ROUTES = {
  BASE: `${environment.customerOrderServiceUrl}/customers`,
  BY_ID: (id: number) => `${environment.customerOrderServiceUrl}/customers/${id}`,
} as const;

export const ORDER_ROUTES = {
  BASE: `${environment.customerOrderServiceUrl}/orders`,
  BY_ID: (id: number) => `${environment.customerOrderServiceUrl}/orders/${id}`,
  COMPLETE: (id: number) => `${environment.customerOrderServiceUrl}/orders/${id}/complete`,
  CANCEL: (id: number) => `${environment.customerOrderServiceUrl}/orders/${id}/cancel`,
} as const;

export const DASHBOARD_ROUTES = {
  STATS: `${environment.customerOrderServiceUrl}/dashboard/stats`,
  ORDERS_BY_DAY: `${environment.customerOrderServiceUrl}/dashboard/orders-by-day`,
  ORDERS_BY_MONTH: `${environment.customerOrderServiceUrl}/dashboard/orders-by-month`,
} as const;
