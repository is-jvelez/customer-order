import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DecimalPipe } from '@angular/common';
import { OrderStore } from '../../../application/store/order.store';
import { OrderService } from '../../../application/services/order.service';
import { CustomerRepository } from '../../../../customers/infrastructure/customer.repository';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusLabelPipe } from '../../../../../shared/pipes/status-label.pipe';
import { PriorityLabelPipe, PriorityChipClassPipe } from '../../../../../shared/pipes/priority-label.pipe';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-order-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    DecimalPipe,
    LoadingSpinnerComponent,
    StatusLabelPipe,
    PriorityLabelPipe,
    PriorityChipClassPipe,
    DateFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <button mat-button routerLink="/orders">
        <mat-icon>arrow_back</mat-icon> Volver a Pedidos
      </button>
    </div>

    @if (store.loading()) {
      <app-loading-spinner />
    } @else if (store.selectedOrder(); as order) {
      <mat-card class="detail-card">
        <mat-card-header>
          <mat-card-title>Pedido #{{ order.id }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip [class]="'chip-' + order.status.toLowerCase()">
              {{ order.status | statusLabel }}
            </mat-chip>
            <mat-chip [class]="order.priority | priorityChipClass">
              {{ order.priority | priorityLabel }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Cliente</span>
              <span>{{ customerName() ?? 'Cliente #' + order.customerId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Total</span>
              <span>$ {{ order.total | number:'1.2-2' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Fecha</span>
              <span>{{ order.createdAt | dateFormat:'long' }}</span>
            </div>
            @if (order.notes) {
              <div class="detail-item">
                <span class="label">Notas</span>
                <span>{{ order.notes }}</span>
              </div>
            }
          </div>

          <h3 class="items-title">Items</h3>
          <table mat-table [dataSource]="order.items" class="items-table" aria-label="Items del pedido">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let item">{{ item.description }}</td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Cantidad</th>
              <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Precio</th>
              <td mat-cell *matCellDef="let item">$ {{ item.price | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="subtotal">
              <th mat-header-cell *matHeaderCellDef>Subtotal</th>
              <td mat-cell *matCellDef="let item">$ {{ item.subtotal | number:'1.2-2' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: itemColumns;"></tr>
          </table>
        </mat-card-content>

        @if (order.status === 'Pending' || order.status === 'InProgress') {
          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="confirmComplete(order.id)">
              <mat-icon>check_circle</mat-icon> Completar
            </button>
            <button mat-flat-button color="warn" (click)="confirmCancel(order.id)">
              <mat-icon>cancel</mat-icon> Cancelar
            </button>
          </mat-card-actions>
        }
      </mat-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .detail-card { max-width: 800px; }
    .detail-card mat-card-subtitle { display: flex; gap: 8px; align-items: center; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding-top: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 500; }
    .items-title { font-size: 16px; font-weight: 500; margin: 24px 0 8px; }
    .items-table { width: 100%; }
    :host ::ng-deep .chip-pending { background-color: #FFF8E1 !important; color: #F57F17 !important; }
    :host ::ng-deep .chip-inprogress { background-color: #E3F2FD !important; color: #1565C0 !important; }
    :host ::ng-deep .chip-completed { background-color: #E8F5E9 !important; color: #2E7D32 !important; }
    :host ::ng-deep .chip-cancelled { background-color: #FFEBEE !important; color: #C62828 !important; }
    :host ::ng-deep .chip-priority-high { background-color: #FFEBEE !important; color: #C62828 !important; }
    :host ::ng-deep .chip-priority-medium { background-color: #FFF8E1 !important; color: #F57F17 !important; }
    :host ::ng-deep .chip-priority-low { background-color: #F5F5F5 !important; color: #616161 !important; }
  `],
})
export class OrderDetailComponent implements OnInit {
  protected readonly store = inject(OrderStore);
  private readonly service = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly customerRepo = inject(CustomerRepository);

  protected readonly itemColumns = ['description', 'quantity', 'price', 'subtotal'];
  protected readonly customerName = signal<string | null>(null);

  constructor() {
    effect(() => {
      const order = this.store.selectedOrder();
      if (order) {
        this.customerRepo.getById(order.customerId).subscribe({
          next: (res) => { if (res.success && res.data) this.customerName.set(res.data.name); },
        });
      } else {
        this.customerName.set(null);
      }
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.service.loadOrderById(id);
  }

  confirmComplete(id: number): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Completar Pedido', message: '¿Marcar este pedido como completado?', confirmLabel: 'Completar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.completeById(id);
    });
  }

  confirmCancel(id: number): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Cancelar Pedido', message: '¿Cancelar este pedido?', confirmLabel: 'Cancelar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.cancelById(id);
    });
  }
}
