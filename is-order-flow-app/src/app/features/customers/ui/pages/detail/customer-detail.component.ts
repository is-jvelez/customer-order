import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CustomerStore } from '../../../application/store/customer.store';
import { CustomerService } from '../../../application/services/customer.service';
import { LoadingSpinnerComponent } from '../../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-customer-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    DateFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <button mat-button routerLink="/customers">
        <mat-icon>arrow_back</mat-icon> Volver a Clientes
      </button>
    </div>

    @if (store.loading()) {
      <app-loading-spinner />
    } @else if (store.selectedCustomer(); as customer) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ customer.name }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip [class]="customer.isActive ? 'chip-active' : 'chip-inactive'">
              {{ customer.isActive ? 'Activo' : 'Inactivo' }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Email</span>
              <span>{{ customer.email }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Teléfono</span>
              <span>{{ customer.phone || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Dirección</span>
              <span>{{ customer.address || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Registrado</span>
              <span>{{ customer.createdAt | dateFormat:'long' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; margin: 0; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding-top: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 500; }
    :host ::ng-deep .chip-active { background-color: #E8F5E9 !important; color: #2E7D32 !important; }
    :host ::ng-deep .chip-inactive { background-color: #F5F5F5 !important; color: #757575 !important; }
  `],
})
export class CustomerDetailComponent implements OnInit {
  protected readonly store = inject(CustomerStore);
  private readonly service = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.service.loadCustomerById(id);
  }
}
