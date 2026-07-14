import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { CustomerStore } from '../../../application/store/customer.store';
import { CustomerService } from '../../../application/services/customer.service';
import { Customer } from '../../../domain/models/customer.model';
import { CustomerFormComponent, CustomerFormDialogData } from '../../components/customer-form/customer-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { DEFAULT_PAGE_SIZE } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-customer-list',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    RouterLink,
    LoadingSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">Clientes</h1>
      <button mat-flat-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Nuevo Cliente
      </button>
    </div>

    @if (store.loading()) {
      <app-loading-spinner />
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="store.customers()" aria-label="Tabla de clientes">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let c">{{ c.name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let c">{{ c.email }}</td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let c">{{ c.phone || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="isActive">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let c">
              <mat-chip [class]="c.isActive ? 'chip-active' : 'chip-inactive'">
                {{ c.isActive ? 'Activo' : 'Inactivo' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let c">
              <a mat-icon-button [routerLink]="['/customers', c.id]" matTooltip="Ver detalle" aria-label="Ver detalle">
                <mat-icon>visibility</mat-icon>
              </a>
              <button mat-icon-button (click)="openEditDialog(c)" matTooltip="Editar" aria-label="Editar cliente">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="confirmDelete(c)" matTooltip="Eliminar" aria-label="Eliminar cliente">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-msg" [attr.colspan]="columns.length">No hay clientes registrados</td>
          </tr>
        </table>

        @if (store.pagination()) {
          <mat-paginator
            [length]="store.pagination()!.total"
            [pageSize]="DEFAULT_PAGE_SIZE"
            [pageIndex]="store.pagination()!.currentPage - 1"
            [pageSizeOptions]="[10, 15, 25]"
            (page)="onPageChange($event)"
            aria-label="Paginación de clientes"
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
    :host ::ng-deep .chip-active { background-color: #E8F5E9 !important; color: #2E7D32 !important; }
    :host ::ng-deep .chip-inactive { background-color: #F5F5F5 !important; color: #757575 !important; }
  `],
})
export class CustomerListComponent implements OnInit {
  protected readonly store = inject(CustomerStore);
  private readonly service = inject(CustomerService);
  private readonly dialog = inject(MatDialog);

  protected readonly columns = ['name', 'email', 'phone', 'isActive', 'actions'];
  protected readonly DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
  private currentPage = 1;

  ngOnInit(): void {
    this.service.loadCustomers();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<CustomerFormComponent, CustomerFormDialogData>(CustomerFormComponent, {
      width: '480px',
      data: { currentPage: this.currentPage },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.service.loadCustomers(this.currentPage);
    });
  }

  openEditDialog(customer: Customer): void {
    const ref = this.dialog.open<CustomerFormComponent, CustomerFormDialogData>(CustomerFormComponent, {
      width: '480px',
      data: { customer, currentPage: this.currentPage },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.service.loadCustomers(this.currentPage);
    });
  }

  confirmDelete(customer: Customer): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Cliente',
        message: `¿Está seguro de eliminar a ${customer.name}?`,
        confirmLabel: 'Eliminar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.service.delete(customer.id, this.currentPage);
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.service.loadCustomers(this.currentPage, event.pageSize);
  }
}
