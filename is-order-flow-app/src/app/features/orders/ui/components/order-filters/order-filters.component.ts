import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { Customer } from '../../../../customers/domain/models/customer.model';
import { OrderFilterParams } from '../../../domain/models/order.model';
import { ORDER_STATUSES, ORDER_PRIORITIES } from '../../../../../shared/constants/app.constants';
import { PriorityLabelPipe } from '../../../../../shared/pipes/priority-label.pipe';

@Component({
  selector: 'app-order-filters',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    PriorityLabelPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-container" [formGroup]="form">
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Estado</mat-label>
        <mat-select formControlName="status">
          <mat-option value="">Todos</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Prioridad</mat-label>
        <mat-select formControlName="priority">
          <mat-option value="">Todas</mat-option>
          @for (p of priorities; track p) {
            <mat-option [value]="p">{{ p | priorityLabel }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Cliente</mat-label>
        <mat-select formControlName="customer_id">
          <mat-option value="">Todos</mat-option>
          @for (c of customers(); track c.id) {
            <mat-option [value]="c.id">{{ c.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Fecha desde</mat-label>
        <input matInput [matDatepicker]="pickerFrom" formControlName="date_from" />
        <mat-datepicker-toggle matIconSuffix [for]="pickerFrom" />
        <mat-datepicker #pickerFrom />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Fecha hasta</mat-label>
        <input matInput [matDatepicker]="pickerTo" formControlName="date_to" />
        <mat-datepicker-toggle matIconSuffix [for]="pickerTo" />
        <mat-datepicker #pickerTo />
      </mat-form-field>

      <div class="filter-actions">
        <button mat-flat-button color="primary" (click)="applyFilters()">Aplicar filtros</button>
        <button mat-button (click)="clearFilters()">Limpiar filtros</button>
      </div>
    </div>
  `,
  styles: [`
    .filters-container { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .filter-field { min-width: 180px; flex: 1; }
    .filter-actions { display: flex; gap: 8px; }
  `],
})
export class OrderFiltersComponent {
  readonly filtersChanged = output<OrderFilterParams>();
  readonly customers = input<Customer[]>([]);

  private readonly fb = inject(FormBuilder);

  protected readonly statuses = ORDER_STATUSES;
  protected readonly priorities = ORDER_PRIORITIES;

  protected readonly form = this.fb.group({
    status: [''],
    priority: [null as number | null],
    customer_id: [null as number | null],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  applyFilters(): void {
    const v = this.form.value;
    const params: OrderFilterParams = {};
    if (v.status) params.status = v.status;
    if (v.priority) params.priority = v.priority;
    if (v.customer_id) params.customer_id = v.customer_id;
    if (v.date_from) params.date_from = this.formatDate(v.date_from);
    if (v.date_to) params.date_to = this.formatDate(v.date_to);
    this.filtersChanged.emit(params);
  }

  clearFilters(): void {
    this.form.reset({ status: '', priority: null, customer_id: null, date_from: null, date_to: null });
    this.filtersChanged.emit({});
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
