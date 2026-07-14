import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDashboardRepository } from '../domain/interfaces/i-dashboard.repository';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DashboardStats } from '../domain/models/stats.model';
import { ChartDataPoint } from '../domain/models/chart-data.model';
import { DASHBOARD_ROUTES } from '../../../shared/constants/api-routes.constants';

interface RawDashboardStats {
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_customers: number;
  active_customers: number;
}

function mapDashboardStats(raw: RawDashboardStats): DashboardStats {
  return {
    totalOrders: raw.total_orders,
    pendingOrders: raw.pending_orders,
    inProgressOrders: raw.in_progress_orders,
    completedOrders: raw.completed_orders,
    cancelledOrders: raw.cancelled_orders,
    totalRevenue: raw.total_revenue,
    totalCustomers: raw.total_customers,
    activeCustomers: raw.active_customers,
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardRepository implements IDashboardRepository {
  private readonly http = inject(HttpClient);

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http
      .get<ApiResponse<RawDashboardStats>>(DASHBOARD_ROUTES.STATS)
      .pipe(map((res) => ({ ...res, data: res.data ? mapDashboardStats(res.data) : null })));
  }

  getOrdersByDay(): Observable<ApiResponse<ChartDataPoint[]>> {
    return this.http.get<ApiResponse<ChartDataPoint[]>>(DASHBOARD_ROUTES.ORDERS_BY_DAY);
  }

  getOrdersByMonth(): Observable<ApiResponse<ChartDataPoint[]>> {
    return this.http.get<ApiResponse<ChartDataPoint[]>>(DASHBOARD_ROUTES.ORDERS_BY_MONTH);
  }
}
