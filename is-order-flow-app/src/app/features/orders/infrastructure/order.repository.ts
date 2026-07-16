import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IOrderRepository } from '../domain/interfaces/i-order.repository';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PaginatedResponse } from '../../../core/models/pagination.model';
import { Order, CreateOrderRequest, OrderFilterParams } from '../domain/models/order.model';
import { OrderItem } from '../domain/models/order-item.model';
import { ORDER_ROUTES } from '../../../shared/constants/api-routes.constants';

// ── Raw shapes returned by the backend ──────────────────────────────────────

interface RawOrderItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

interface RawOrder {
  id: number;
  customer_id: number;
  status: string;
  priority: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: RawOrderItem[];
}

interface RawOrdersResponse {
  items: RawOrder[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapOrderItem(raw: RawOrderItem): OrderItem {
  return {
    id: raw.id,
    orderId: 0,
    description: raw.description,
    quantity: raw.quantity,
    price: raw.unit_price,
    subtotal: raw.quantity * raw.unit_price,
  };
}

function mapOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    customerId: raw.customer_id,
    customerName: null,
    status: raw.status as Order['status'],
    priority: raw.priority as Order['priority'],
    total: raw.total,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    items: (raw.items ?? []).map(mapOrderItem),
  };
}

function mapOrdersPage(raw: RawOrdersResponse): PaginatedResponse<Order> {
  return {
    data: raw.items.map(mapOrder),
    current_page: raw.pagination.current_page,
    per_page: raw.pagination.per_page,
    total: raw.pagination.total,
    last_page: raw.pagination.last_page,
  };
}

// ── Repository ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OrderRepository implements IOrderRepository {
  private readonly http = inject(HttpClient);

  getAll(params: OrderFilterParams): Observable<ApiResponse<PaginatedResponse<Order>>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.customer_id) httpParams = httpParams.set('customer_id', params.customer_id);
    if (params.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params.date_to) httpParams = httpParams.set('date_to', params.date_to);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    return this.http
      .get<ApiResponse<RawOrdersResponse>>(ORDER_ROUTES.BASE, { params: httpParams })
      .pipe(map((res) => ({ ...res, data: res.data ? mapOrdersPage(res.data) : null })));
  }

  getById(id: number): Observable<ApiResponse<Order>> {
    return this.http
      .get<ApiResponse<RawOrder>>(ORDER_ROUTES.BY_ID(id))
      .pipe(map((res) => ({ ...res, data: res.data ? mapOrder(res.data) : null })));
  }

  create(data: CreateOrderRequest): Observable<ApiResponse<Order>> {
    const body = {
      customer_id: data.customerId,
      notes: data.notes ?? null,
      priority: data.priority,
      items: data.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.price,
      })),
    };
    return this.http
      .post<ApiResponse<RawOrder>>(ORDER_ROUTES.BASE, body)
      .pipe(map((res) => ({ ...res, data: res.data ? mapOrder(res.data) : null })));
  }

  complete(id: number): Observable<ApiResponse<Order>> {
    return this.http
      .patch<ApiResponse<RawOrder>>(ORDER_ROUTES.COMPLETE(id), {})
      .pipe(map((res) => ({ ...res, data: res.data ? mapOrder(res.data) : null })));
  }

  cancel(id: number): Observable<ApiResponse<Order>> {
    return this.http
      .patch<ApiResponse<RawOrder>>(ORDER_ROUTES.CANCEL(id), {})
      .pipe(map((res) => ({ ...res, data: res.data ? mapOrder(res.data) : null })));
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(ORDER_ROUTES.BY_ID(id));
  }
}
