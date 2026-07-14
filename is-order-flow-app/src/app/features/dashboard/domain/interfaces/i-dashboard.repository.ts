import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { DashboardStats } from '../models/stats.model';
import { ChartDataPoint } from '../models/chart-data.model';

export interface IDashboardRepository {
  getStats(): Observable<ApiResponse<DashboardStats>>;
  getOrdersByDay(): Observable<ApiResponse<ChartDataPoint[]>>;
  getOrdersByMonth(): Observable<ApiResponse<ChartDataPoint[]>>;
}
