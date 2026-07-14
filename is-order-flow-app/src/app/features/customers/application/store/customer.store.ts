import { Injectable, signal } from '@angular/core';
import { Customer } from '../../domain/models/customer.model';
import { PaginationMeta } from '../../../../core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly _customers = signal<Customer[]>([]);
  private readonly _selectedCustomer = signal<Customer | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pagination = signal<PaginationMeta | null>(null);

  readonly customers = this._customers.asReadonly();
  readonly selectedCustomer = this._selectedCustomer.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  setCustomers(customers: Customer[], meta: PaginationMeta): void {
    this._customers.set(customers);
    this._pagination.set(meta);
  }

  setSelectedCustomer(customer: Customer | null): void {
    this._selectedCustomer.set(customer);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }
}
