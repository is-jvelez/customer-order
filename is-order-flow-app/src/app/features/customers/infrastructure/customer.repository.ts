import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICustomerRepository } from '../domain/interfaces/i-customer.repository';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Customer, CreateCustomerRequest, CustomerFilterParams, UpdateCustomerRequest } from '../domain/models/customer.model';
import { CUSTOMER_ROUTES } from '../../../shared/constants/api-routes.constants';

// Shape the backend actually sends (snake_case)
interface RawCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

function mapCustomer(raw: RawCustomer): Customer {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    address: raw.address,
    isActive: raw.is_active,
    createdAt: raw.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class CustomerRepository implements ICustomerRepository {
  private readonly http = inject(HttpClient);

  getAll(params: CustomerFilterParams): Observable<ApiResponse<Customer[]>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page);
    return this.http
      .get<ApiResponse<RawCustomer[]>>(CUSTOMER_ROUTES.BASE, { params: httpParams })
      .pipe(map((res) => ({ ...res, data: res.data ? res.data.map(mapCustomer) : null })));
  }

  getById(id: number): Observable<ApiResponse<Customer>> {
    return this.http
      .get<ApiResponse<RawCustomer>>(CUSTOMER_ROUTES.BY_ID(id))
      .pipe(map((res) => ({ ...res, data: res.data ? mapCustomer(res.data) : null })));
  }

  create(data: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http
      .post<ApiResponse<RawCustomer>>(CUSTOMER_ROUTES.BASE, data)
      .pipe(map((res) => ({ ...res, data: res.data ? mapCustomer(res.data) : null })));
  }

  update(id: number, data: UpdateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http
      .put<ApiResponse<RawCustomer>>(CUSTOMER_ROUTES.BY_ID(id), data)
      .pipe(map((res) => ({ ...res, data: res.data ? mapCustomer(res.data) : null })));
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(CUSTOMER_ROUTES.BY_ID(id));
  }
}
