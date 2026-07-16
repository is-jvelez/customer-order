import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderStore } from '../../../application/store/order.store';
import { OrderService } from '../../../application/services/order.service';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { Order } from '../../../domain/models/order.model';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: 1,
    customerId: 1,
    customerName: null,
    status: 'Pending',
    priority: OrderPriority.Medium,
    notes: null,
    total: 100,
    items: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('OrderListComponent — columna y badge de Prioridad (CR-001)', () => {
  let store: OrderStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OrderService, useValue: { loadOrders: () => {} } },
        { provide: CustomerRepository, useValue: { getAll: () => of({ success: true, data: [] }) } },
      ],
    }).compileComponents();

    store = TestBed.inject(OrderStore);
  });

  it('golden master: conserva las columnas previas y el badge de Estado sin cambios, y añade "priority" entre "status" y "total"', () => {
    store.setOrders(
      [makeOrder({ id: 1, status: 'Pending', priority: OrderPriority.Medium })],
      { total: 1, perPage: 15, currentPage: 1, lastPage: 1 }
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const columns = (fixture.componentInstance as any).columns as string[];
    expect(columns).toEqual(['id', 'customer', 'status', 'priority', 'total', 'createdAt', 'actions']);
    expect(columns.indexOf('priority')).toBe(columns.indexOf('status') + 1);
    expect(columns.indexOf('priority')).toBe(columns.indexOf('total') - 1);

    const statusChip = fixture.nativeElement.querySelector('mat-chip.chip-pending');
    expect(statusChip?.textContent).toContain('Pendiente');
  });

  it('renderiza el badge de prioridad Alta con la clase de color roja y la etiqueta "Alta"', () => {
    store.setOrders(
      [makeOrder({ id: 1, priority: OrderPriority.High })],
      { total: 1, perPage: 15, currentPage: 1, lastPage: 1 }
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('mat-chip.chip-priority-3');
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain('Alta');
  });

  it('renderiza el badge de prioridad Media con la clase amarilla y la etiqueta "Media"', () => {
    store.setOrders(
      [makeOrder({ id: 1, priority: OrderPriority.Medium })],
      { total: 1, perPage: 15, currentPage: 1, lastPage: 1 }
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('mat-chip.chip-priority-2');
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain('Media');
  });

  it('renderiza el badge de prioridad Baja con la clase gris y la etiqueta "Baja"', () => {
    store.setOrders(
      [makeOrder({ id: 1, priority: OrderPriority.Low })],
      { total: 1, perPage: 15, currentPage: 1, lastPage: 1 }
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('mat-chip.chip-priority-1');
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain('Baja');
  });
});
