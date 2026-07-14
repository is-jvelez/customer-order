import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { PaginatedResponse } from '../../../../core/models/pagination.model';
import { Order, CreateOrderRequest, OrderFilterParams } from '../models/order.model';

export interface IOrderRepository {
  getAll(params: OrderFilterParams): Observable<ApiResponse<PaginatedResponse<Order>>>;
  getById(id: number): Observable<ApiResponse<Order>>;
  create(data: CreateOrderRequest): Observable<ApiResponse<Order>>;
  complete(id: number): Observable<ApiResponse<Order>>;
  cancel(id: number): Observable<ApiResponse<Order>>;
  delete(id: number): Observable<ApiResponse<void>>;
}
