import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
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

describe('OrderDetailComponent — badge de Prioridad junto al de Estado (CR-001)', () => {
  let store: OrderStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: OrderService, useValue: { loadOrderById: () => {} } },
        { provide: CustomerRepository, useValue: { getById: () => of({ success: true, data: null }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(OrderStore);
  });

  it('golden master: conserva el badge de Estado sin cambios y añade el de Prioridad junto a él', () => {
    store.setSelectedOrder(makeOrder({ status: 'InProgress', priority: OrderPriority.High }));

    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();

    const statusChip = fixture.nativeElement.querySelector('mat-chip.chip-inprogress');
    expect(statusChip?.textContent).toContain('En Progreso');

    const priorityChip = fixture.nativeElement.querySelector('mat-chip.chip-priority-3');
    expect(priorityChip).toBeTruthy();
    expect(priorityChip?.textContent).toContain('Alta');
  });
});
