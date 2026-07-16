import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { OrderStore } from '../../../application/store/order.store';
import { OrderService } from '../../../application/services/order.service';
import { Order, OrderFilterParams } from '../../../domain/models/order.model';
import { Customer } from '../../../../customers/domain/models/customer.model';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { OrderFormComponent } from '../../components/order-form/order-form.component';
import { OrderFiltersComponent } from '../../components/order-filters/order-filters.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusLabelPipe } from '../../../../../shared/pipes/status-label.pipe';
import { PriorityLabelPipe } from '../../../../../shared/pipes/priority-label.pipe';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';
import { DEFAULT_PAGE_SIZE } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-order-list',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    RouterLink,
    DecimalPipe,
    LoadingSpinnerComponent,
    StatusLabelPipe,
    PriorityLabelPipe,
    DateFormatPipe,
    OrderFiltersComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">Pedidos</h1>
      <button mat-flat-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Nuevo Pedido
      </button>
    </div>

    <app-order-filters [customers]="customersList()" (filtersChanged)="onFiltersChanged($event)" />

    @if (store.loading()) {
      <app-loading-spinner />
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="store.orders()" aria-label="Tabla de pedidos">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let o">{{ o.id }}</td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let o">{{ getCustomerName(o.customerId) }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let o">
              <mat-chip [class]="'chip-' + o.status.toLowerCase()">
                {{ o.status | statusLabel }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Prioridad</th>
            <td mat-cell *matCellDef="let o">
              <mat-chip [class]="'chip-priority-' + o.priority">
                {{ o.priority | priorityLabel }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let o">$ {{ o.total | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let o">{{ o.createdAt | dateFormat }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let o">
              <a mat-icon-button [routerLink]="['/orders', o.id]" matTooltip="Ver detalle" aria-label="Ver detalle">
                <mat-icon>visibility</mat-icon>
              </a>
              @if (o.status === 'Pending' || o.status === 'InProgress') {
                <button mat-icon-button color="primary" (click)="confirmComplete(o)" matTooltip="Completar" aria-label="Completar pedido">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="confirmCancel(o)" matTooltip="Cancelar" aria-label="Cancelar pedido">
                  <mat-icon>cancel</mat-icon>
                </button>
              }
              <button mat-icon-button color="warn" (click)="confirmDelete(o)" matTooltip="Eliminar" aria-label="Eliminar pedido">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-msg" [attr.colspan]="columns.length">No hay pedidos</td>
          </tr>
        </table>

        @if (store.pagination()) {
          <mat-paginator
            [length]="store.pagination()!.total"
            [pageSize]="DEFAULT_PAGE_SIZE"
            [pageIndex]="store.pagination()!.currentPage - 1"
            [pageSizeOptions]="[10, 15, 25]"
            (page)="onPageChange($event)"
            aria-label="Paginación de pedidos"
          />
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; margin: 0; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    .empty-msg { text-align: center; padding: 32px; color: #666; }
    :host ::ng-deep .chip-pending { background-color: #FFF8E1 !important; color: #F57F17 !important; }
    :host ::ng-deep .chip-inprogress { background-color: #E3F2FD !important; color: #1565C0 !important; }
    :host ::ng-deep .chip-completed { background-color: #E8F5E9 !important; color: #2E7D32 !important; }
    :host ::ng-deep .chip-cancelled { background-color: #FFEBEE !important; color: #C62828 !important; }
    :host ::ng-deep .chip-priority-1 { background-color: #F5F5F5 !important; color: #616161 !important; }
    :host ::ng-deep .chip-priority-2 { background-color: #FFF8E1 !important; color: #F57F17 !important; }
    :host ::ng-deep .chip-priority-3 { background-color: #FFEBEE !important; color: #C62828 !important; }
  `],
})
export class OrderListComponent implements OnInit {
  protected readonly store = inject(OrderStore);
  private readonly service = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  private readonly customerRepo = inject(CustomerRepository);

  protected readonly columns = ['id', 'customer', 'status', 'priority', 'total', 'createdAt', 'actions'];
  protected readonly DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
  private currentFilters: OrderFilterParams = {};

  protected readonly customersList = signal<Customer[]>([]);
  private readonly customerMap = computed(() => new Map(this.customersList().map(c => [c.id, c.name])));

  ngOnInit(): void {
    this.service.loadOrders();
    this.customerRepo.getAll({ per_page: 100 }).subscribe({
      next: (res) => { if (res.success && res.data) this.customersList.set(res.data); },
    });
  }

  protected getCustomerName(customerId: number): string {
    return this.customerMap().get(customerId) ?? `Cliente #${customerId}`;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(OrderFormComponent, { width: '600px', maxHeight: '90vh' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.service.loadOrders(this.currentFilters);
    });
  }

  onFiltersChanged(filters: OrderFilterParams): void {
    this.currentFilters = filters;
    this.service.loadOrders({ ...filters, page: 1 });
  }

  onPageChange(event: PageEvent): void {
    this.service.loadOrders({ ...this.currentFilters, page: event.pageIndex + 1, per_page: event.pageSize });
  }

  confirmComplete(order: Order): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Completar Pedido', message: `¿Completar el pedido #${order.id}?`, confirmLabel: 'Completar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.complete(order.id, this.currentFilters);
    });
  }

  confirmCancel(order: Order): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Cancelar Pedido', message: `¿Cancelar el pedido #${order.id}?`, confirmLabel: 'Cancelar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.cancel(order.id, this.currentFilters);
    });
  }

  confirmDelete(order: Order): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Eliminar Pedido', message: `¿Eliminar el pedido #${order.id}?`, confirmLabel: 'Eliminar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.delete(order.id, this.currentFilters);
    });
  }
}
