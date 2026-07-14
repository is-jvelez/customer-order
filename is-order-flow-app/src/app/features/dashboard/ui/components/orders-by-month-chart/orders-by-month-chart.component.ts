import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsCoreOption } from 'echarts/core';
import { ChartDataPoint } from '../../../domain/models/chart-data.model';

@Component({
  selector: 'app-orders-by-month-chart',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      echarts
      [options]="chartOptions()"
      class="chart"
    ></div>
  `,
  styles: [`.chart { width: 100%; height: 300px; }`],
})
export class OrdersByMonthChartComponent {
  readonly data = input.required<ChartDataPoint[]>();

  readonly chartOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: this.data().map((d) => d.date),
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: 'Pedidos',
      type: 'bar',
      data: this.data().map((d) => d.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#1565C0' },
            { offset: 1, color: '#0288D1' },
          ],
        },
      },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  }));
}
