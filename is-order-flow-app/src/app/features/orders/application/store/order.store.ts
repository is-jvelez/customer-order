import { Injectable, signal } from '@angular/core';
import { Order, OrderFilterParams } from '../../domain/models/order.model';
import { PaginationMeta } from '../../../../core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly _orders = signal<Order[]>([]);
  private readonly _selectedOrder = signal<Order | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pagination = signal<PaginationMeta | null>(null);
  private readonly _filters = signal<OrderFilterParams>({});

  readonly orders = this._orders.asReadonly();
  readonly selectedOrder = this._selectedOrder.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly filters = this._filters.asReadonly();

  setOrders(orders: Order[], meta: PaginationMeta): void {
    this._orders.set(orders);
    this._pagination.set(meta);
  }

  setSelectedOrder(order: Order | null): void {
    this._selectedOrder.set(order);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  setFilters(filters: OrderFilterParams): void {
    this._filters.set(filters);
  }
}
