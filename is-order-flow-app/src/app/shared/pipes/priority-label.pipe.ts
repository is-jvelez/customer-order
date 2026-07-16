import { Pipe, PipeTransform } from '@angular/core';
import { OrderPriority } from '../constants/app.constants';

const PRIORITY_LABELS: Record<number, string> = {
  [OrderPriority.Low]: 'Baja',
  [OrderPriority.Medium]: 'Media',
  [OrderPriority.High]: 'Alta',
};

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: number): string {
    return PRIORITY_LABELS[value] ?? String(value);
  }
}
