import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
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

describe('OrderDetailComponent — priority badge', () => {
  let store: OrderStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        { provide: OrderService, useValue: { loadOrderById: () => undefined } },
        { provide: CustomerRepository, useValue: { getById: () => of({ success: true, data: null }) } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(null) }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    });
    store = TestBed.inject(OrderStore);
  });

  it('shows the priority badge next to the status badge', () => {
    store.setSelectedOrder(buildOrder({ priority: OrderPriority.High }));

    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();

    const priorityChip = fixture.nativeElement.querySelector('mat-chip.chip-priority-3');
    expect(priorityChip).toBeTruthy();
    expect(priorityChip.textContent).toContain('Alta');

    const statusChip = fixture.nativeElement.querySelector('mat-chip.chip-pending');
    expect(statusChip).toBeTruthy();
  });
});
