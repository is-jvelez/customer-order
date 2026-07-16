import { Pipe, PipeTransform } from '@angular/core';
import { OrderPriority } from '../constants/app.constants';

const PRIORITY_LABELS: Record<OrderPriority, string> = {
  [OrderPriority.Low]: 'Baja',
  [OrderPriority.Medium]: 'Media',
  [OrderPriority.High]: 'Alta',
};

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: OrderPriority | number): string {
    return PRIORITY_LABELS[value as OrderPriority] ?? String(value);
  }
}
