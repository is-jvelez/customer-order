import { inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DashboardRepository } from '../../infrastructure/dashboard.repository';
import { DashboardStore } from '../store/dashboard.store';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly repo = inject(DashboardRepository);
  private readonly store = inject(DashboardStore);

  loadAll(): void {
    this.store.setLoading(true);
    forkJoin({
      stats: this.repo.getStats(),
      byDay: this.repo.getOrdersByDay(),
      byMonth: this.repo.getOrdersByMonth(),
    }).subscribe({
      next: ({ stats, byDay, byMonth }) => {
        this.store.setLoading(false);
        if (stats.success && stats.data) this.store.setStats(stats.data);
        if (byDay.success && byDay.data) this.store.setOrdersByDay(byDay.data);
        if (byMonth.success && byMonth.data) this.store.setOrdersByMonth(byMonth.data);
      },
      error: () => this.store.setLoading(false),
    });
  }
}
