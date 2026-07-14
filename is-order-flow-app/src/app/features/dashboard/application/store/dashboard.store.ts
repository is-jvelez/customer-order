import { Injectable, signal } from '@angular/core';
import { DashboardStats } from '../../domain/models/stats.model';
import { ChartDataPoint } from '../../domain/models/chart-data.model';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _ordersByDay = signal<ChartDataPoint[]>([]);
  private readonly _ordersByMonth = signal<ChartDataPoint[]>([]);
  private readonly _loading = signal(false);

  readonly stats = this._stats.asReadonly();
  readonly ordersByDay = this._ordersByDay.asReadonly();
  readonly ordersByMonth = this._ordersByMonth.asReadonly();
  readonly loading = this._loading.asReadonly();

  setStats(stats: DashboardStats): void {
    this._stats.set(stats);
  }

  setOrdersByDay(data: ChartDataPoint[]): void {
    this._ordersByDay.set(data);
  }

  setOrdersByMonth(data: ChartDataPoint[]): void {
    this._ordersByMonth.set(data);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }
}
