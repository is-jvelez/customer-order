import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { DashboardStore } from '../../application/store/dashboard.store';
import { DashboardService } from '../../application/services/dashboard.service';
import { StatsCardComponent } from '../components/stats-card/stats-card.component';
import { OrdersByDayChartComponent } from '../components/orders-by-day-chart/orders-by-day-chart.component';
import { OrdersByMonthChartComponent } from '../components/orders-by-month-chart/orders-by-month-chart.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatCardModule,
    MatGridListModule,
    StatsCardComponent,
    OrdersByDayChartComponent,
    OrdersByMonthChartComponent,
    LoadingSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Dashboard</h1>

    @if (store.loading()) {
      <app-loading-spinner />
    } @else {
      @if (store.stats(); as stats) {
        <div class="stats-grid">
          <app-stats-card label="Total Pedidos" [value]="stats.totalOrders" icon="inventory_2" />
          <app-stats-card label="Completados" [value]="stats.completedOrders" icon="check_circle" />
          <app-stats-card label="Pendientes" [value]="stats.pendingOrders" icon="pending" />
          <app-stats-card label="Clientes Activos" [value]="stats.activeCustomers" icon="group" />
        </div>
      }

      <div class="charts-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Pedidos por día (últimos 30 días)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (store.ordersByDay().length > 0) {
              <app-orders-by-day-chart [data]="store.ordersByDay()" />
            } @else {
              <p class="no-data">Sin datos disponibles</p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Pedidos por mes (últimos 12 meses)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (store.ordersByMonth().length > 0) {
              <app-orders-by-month-chart [data]="store.ordersByMonth()" />
            } @else {
              <p class="no-data">Sin datos disponibles</p>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 24px; font-weight: 500; margin: 0 0 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .no-data { text-align: center; color: #666; padding: 24px; }
    @media (max-width: 960px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(DashboardStore);
  private readonly service = inject(DashboardService);

  ngOnInit(): void {
    this.service.loadAll();
  }
}
