import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsCoreOption } from 'echarts/core';
import { ChartDataPoint } from '../../../domain/models/chart-data.model';

@Component({
  selector: 'app-orders-by-day-chart',
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
export class OrdersByDayChartComponent {
  readonly data = input.required<ChartDataPoint[]>();

  readonly chartOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: this.data().map((d) => d.date),
      axisLabel: { rotate: 45, fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: 'Pedidos',
      type: 'line',
      data: this.data().map((d) => d.count),
      smooth: true,
      lineStyle: { color: '#1565C0' },
      itemStyle: { color: '#1565C0' },
      areaStyle: { color: 'rgba(21, 101, 192, 0.1)' },
    }],
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  }));
}
