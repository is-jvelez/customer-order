import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { OrderFormComponent } from './order-form.component';
import { OrderService } from '../../../application/services/order.service';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

describe('OrderFormComponent — selector de Prioridad (CR-001)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: OrderService,
          useValue: { create: () => of({ success: true, data: null, message: '', errors: [] }) },
        },
        {
          provide: CustomerRepository,
          useValue: { getAll: () => of({ success: true, data: [] }) },
        },
      ],
    }).compileComponents();
  });

  it('el formulario arranca con "priority" en Media (OrderPriority.Medium = 2) preseleccionada', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();

    const form = (fixture.componentInstance as any).form;
    expect(form.get('priority')?.value).toBe(OrderPriority.Medium);
  });

  it('permite cambiar la prioridad seleccionada a Alta', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();

    const form = (fixture.componentInstance as any).form;
    form.get('priority')?.setValue(OrderPriority.High);
    expect(form.get('priority')?.value).toBe(OrderPriority.High);
  });

  it('envía la prioridad seleccionada al crear el pedido', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    const instance = fixture.componentInstance as any;
    fixture.detectChanges();

    let sentPayload: any = null;
    instance.orderService.create = (payload: unknown) => {
      sentPayload = payload;
      return of({ success: true, data: null, message: '', errors: [] });
    };
    instance.itemsFormRef = { isValid: () => true, getItems: () => [] };
    instance.form.patchValue({ customerId: 1, priority: OrderPriority.High });

    instance.submit();

    expect(sentPayload?.priority).toBe(OrderPriority.High);
  });
});
