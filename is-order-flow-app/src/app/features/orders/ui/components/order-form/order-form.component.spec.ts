import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { OrderFormComponent } from './order-form.component';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { OrderService } from '../../../application/services/order.service';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

describe('OrderFormComponent — CR-001 priority selector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: CustomerRepository, useValue: { getAll: () => of({ success: true, data: [], message: '', errors: [] }) } },
        { provide: NotificationService, useValue: { success: () => {}, error: () => {} } },
        { provide: OrderService, useValue: { create: () => of({ success: true, data: null, message: '', errors: [] }) } },
      ],
    });
  });

  it('preselects "Media" (OrderPriority.Medium) by default, unchanged by the user', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].value.priority).toBe(OrderPriority.Medium);
  });

  it('allows the user to change the preselected priority before submit', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();

    fixture.componentInstance['form'].patchValue({ priority: OrderPriority.High });

    expect(fixture.componentInstance['form'].value.priority).toBe(OrderPriority.High);
  });
});
