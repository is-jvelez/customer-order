import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { Customer, CreateCustomerRequest, CustomerFilterParams, UpdateCustomerRequest } from '../models/customer.model';

export interface ICustomerRepository {
  getAll(params: CustomerFilterParams): Observable<ApiResponse<Customer[]>>;
  getById(id: number): Observable<ApiResponse<Customer>>;
  create(data: CreateCustomerRequest): Observable<ApiResponse<Customer>>;
  update(id: number, data: UpdateCustomerRequest): Observable<ApiResponse<Customer>>;
  delete(id: number): Observable<ApiResponse<void>>;
}
