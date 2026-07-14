import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderRepository } from '../../infrastructure/order.repository';
import { OrderStore } from '../store/order.store';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CreateOrderRequest, Order, OrderFilterParams } from '../../domain/models/order.model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { DEFAULT_PAGE_SIZE } from '../../../../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly repo = inject(OrderRepository);
  private readonly store = inject(OrderStore);
  private readonly notify = inject(NotificationService);

  loadOrders(params: OrderFilterParams = {}): void {
    this.store.setLoading(true);
    this.store.setError(null);
    const mergedParams = { per_page: DEFAULT_PAGE_SIZE, page: 1, ...params };
    this.repo.getAll(mergedParams).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success && res.data) {
          this.store.setOrders(res.data.data, {
            currentPage: res.data.current_page,
            perPage: res.data.per_page,
            total: res.data.total,
            lastPage: res.data.last_page,
          });
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.store.setError('Error al cargar pedidos');
      },
    });
  }

  loadOrderById(id: number): void {
    this.store.setLoading(true);
    this.repo.getById(id).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success && res.data) {
          this.store.setSelectedOrder(res.data);
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.notify.error('Pedido no encontrado');
      },
    });
  }

  create(data: CreateOrderRequest): Observable<ApiResponse<Order>> {
    return this.repo.create(data);
  }

  complete(id: number, currentFilters: OrderFilterParams = {}): void {
    this.repo.complete(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('Pedido completado');
          this.loadOrders(currentFilters);
        }
      },
      error: () => this.notify.error('Error al completar pedido'),
    });
  }

  cancel(id: number, currentFilters: OrderFilterParams = {}): void {
    this.repo.cancel(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('Pedido cancelado');
          this.loadOrders(currentFilters);
        }
      },
      error: () => this.notify.error('Error al cancelar pedido'),
    });
  }

  delete(id: number, currentFilters: OrderFilterParams = {}): void {
    this.repo.delete(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('Pedido eliminado');
          this.loadOrders(currentFilters);
        }
      },
      error: () => this.notify.error('Error al eliminar pedido'),
    });
  }

  completeById(id: number): void {
    this.repo.complete(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notify.success('Pedido completado');
          this.store.setSelectedOrder(res.data);
        }
      },
      error: () => this.notify.error('Error al completar pedido'),
    });
  }

  cancelById(id: number): void {
    this.repo.cancel(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notify.success('Pedido cancelado');
          this.store.setSelectedOrder(res.data);
        }
      },
      error: () => this.notify.error('Error al cancelar pedido'),
    });
  }
}
