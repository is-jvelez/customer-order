import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { Customer } from '../../../../customers/domain/models/customer.model';
import { OrderService } from '../../../application/services/order.service';
import { OrderItemsFormComponent } from '../order-items-form/order-items-form.component';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { ORDER_PRIORITIES, OrderPriority, DEFAULT_ORDER_PRIORITY } from '../../../../../shared/constants/app.constants';
import { PriorityLabelPipe } from '../../../../../shared/pipes/priority-label.pipe';

@Component({
  selector: 'app-order-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    OrderItemsFormComponent,
    PriorityLabelPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Nuevo Pedido</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cliente</mat-label>
          <mat-select formControlName="customerId">
            @for (c of customers(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('customerId')?.hasError('required') && form.get('customerId')?.touched) {
            <mat-error>Selecciona un cliente</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas (opcional)</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Prioridad</mat-label>
          <mat-select formControlName="priority">
            @for (p of priorities; track p) {
              <mat-option [value]="p">{{ p | priorityLabel }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>

      <app-order-items-form #itemsForm />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Crear Pedido }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class OrderFormComponent implements OnInit {
  @ViewChild('itemsForm') itemsFormRef!: OrderItemsFormComponent;

  private readonly dialogRef = inject(MatDialogRef<OrderFormComponent>);
  private readonly orderService = inject(OrderService);
  private readonly customerRepo = inject(CustomerRepository);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly priorities = ORDER_PRIORITIES;

  protected readonly form = this.fb.group({
    customerId: [null as number | null, Validators.required],
    notes: [''],
    priority: [DEFAULT_ORDER_PRIORITY as OrderPriority, Validators.required],
  });

  ngOnInit(): void {
    this.customerRepo.getAll({ per_page: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customers.set(res.data);
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid || !this.itemsFormRef.isValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.orderService.create({
      customerId: this.form.value.customerId!,
      notes: this.form.value.notes || null,
      priority: this.form.value.priority ?? DEFAULT_ORDER_PRIORITY,
      items: this.itemsFormRef.getItems(),
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success('Pedido creado exitosamente');
          this.dialogRef.close(true);
        } else {
          this.notify.error(res.message || 'Error al crear pedido');
        }
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Error al crear el pedido');
      },
    });
  }
}
