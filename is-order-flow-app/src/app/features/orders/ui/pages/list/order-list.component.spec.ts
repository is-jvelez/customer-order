import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderStore } from '../../../application/store/order.store';
import { OrderService } from '../../../application/services/order.service';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { Order } from '../../../domain/models/order.model';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

function buildOrder(overrides: Partial<Order>): Order {
  return {
    id: 1,
    customerId: 1,
    customerName: null,
    status: 'Pending',
    priority: OrderPriority.Medium,
    notes: null,
    total: 100,
    items: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('OrderListComponent — priority badge', () => {
  let store: OrderStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: { loadOrders: () => undefined } },
        { provide: CustomerRepository, useValue: { getAll: () => of({ success: true, data: [] }) } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(null) }) } },
      ],
    });
    store = TestBed.inject(OrderStore);
  });

  it('renders the priority column with the correct badge class per value (1=gray, 2=amarillo, 3=rojo)', () => {
    store.setOrders(
      [
        buildOrder({ id: 1, priority: OrderPriority.Low }),
        buildOrder({ id: 2, priority: OrderPriority.Medium }),
        buildOrder({ id: 3, priority: OrderPriority.High }),
      ],
      { currentPage: 1, perPage: 15, total: 3, lastPage: 1 },
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('mat-chip[class*="chip-priority-"]');
    expect(chips.length).toBe(3);
    expect(chips[0].className).toContain('chip-priority-1');
    expect(chips[0].textContent).toContain('Baja');
    expect(chips[1].className).toContain('chip-priority-2');
    expect(chips[1].textContent).toContain('Media');
    expect(chips[2].className).toContain('chip-priority-3');
    expect(chips[2].textContent).toContain('Alta');
  });

  it('keeps the previous columns/badges unchanged for the existing status values (golden master)', () => {
    store.setOrders(
      [buildOrder({ id: 1, status: 'Completed', priority: OrderPriority.Medium })],
      { currentPage: 1, perPage: 15, total: 1, lastPage: 1 },
    );

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();

    const statusChip = fixture.nativeElement.querySelector('mat-chip.chip-completed');
    expect(statusChip).toBeTruthy();
    expect(statusChip.textContent).toContain('Completado');
  });
});
