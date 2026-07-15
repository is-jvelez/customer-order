import { Pipe, PipeTransform } from '@angular/core';
import { OrderPriority } from '../constants/app.constants';

// Etiquetas UI (es) del contrato CR-001: 1→"Baja", 2→"Media", 3→"Alta"
const PRIORITY_LABELS: Record<OrderPriority, string> = {
  [OrderPriority.Low]: 'Baja',
  [OrderPriority.Medium]: 'Media',
  [OrderPriority.High]: 'Alta',
};

// Colores de badge del contrato CR-001: Alta = rojo, Media = amarillo, Baja = gris
const PRIORITY_CHIP_CLASS: Record<OrderPriority, string> = {
  [OrderPriority.Low]: 'chip-priority-low',
  [OrderPriority.Medium]: 'chip-priority-medium',
  [OrderPriority.High]: 'chip-priority-high',
};

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: OrderPriority): string {
    return PRIORITY_LABELS[value] ?? String(value);
  }
}

@Pipe({ name: 'priorityChipClass' })
export class PriorityChipClassPipe implements PipeTransform {
  transform(value: OrderPriority): string {
    return PRIORITY_CHIP_CLASS[value] ?? 'chip-priority-medium';
  }
}
