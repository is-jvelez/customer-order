import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { OrderFormComponent } from './order-form.component';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

describe('OrderFormComponent — priority selector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: CustomerRepository, useValue: { getAll: () => of({ success: true, data: [] }) } },
        { provide: NotificationService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    });
  });

  it('preselects "Media" (OrderPriority.Medium) by default', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as { form: { value: { priority: OrderPriority } } };
    expect(component.form.value.priority).toBe(OrderPriority.Medium);
  });

  it('allows the user to change the priority away from the default', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      form: { value: { priority: OrderPriority }; patchValue: (v: Partial<{ priority: OrderPriority }>) => void };
    };
    component.form.patchValue({ priority: OrderPriority.High });
    expect(component.form.value.priority).toBe(OrderPriority.High);
  });
});
