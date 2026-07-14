import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerRepository } from '../../infrastructure/customer.repository';
import { CustomerStore } from '../store/customer.store';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../domain/models/customer.model';
import { DEFAULT_PAGE_SIZE } from '../../../../shared/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly repo = inject(CustomerRepository);
  private readonly store = inject(CustomerStore);
  private readonly notify = inject(NotificationService);

  loadCustomers(page = 1, perPage = DEFAULT_PAGE_SIZE): void {
    this.store.setLoading(true);
    this.store.setError(null);
    this.repo.getAll({ page, per_page: perPage }).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success && res.data) {
          // Backend returns a plain array (not paginated), build synthetic meta
          const customers = res.data;
          this.store.setCustomers(customers, {
            currentPage: page,
            perPage,
            total: customers.length,
            lastPage: 1,
          });
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.store.setError('Error al cargar clientes');
      },
    });
  }

  loadCustomerById(id: number): void {
    this.store.setLoading(true);
    this.repo.getById(id).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success && res.data) {
          this.store.setSelectedCustomer(res.data);
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.notify.error('Cliente no encontrado');
      },
    });
  }

  create(data: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.repo.create(data);
  }

  update(id: number, data: UpdateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.repo.update(id, data);
  }

  delete(id: number, page = 1): void {
    this.repo.delete(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('Cliente eliminado');
          this.loadCustomers(page);
        } else {
          this.notify.error(res.message || 'Error al eliminar');
        }
      },
      error: () => this.notify.error('Error al eliminar cliente'),
    });
  }
}
