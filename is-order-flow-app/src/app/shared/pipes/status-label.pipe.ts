import { Pipe, PipeTransform } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Pendiente',
  InProgress: 'En Progreso',
  Completed: 'Completado',
  Cancelled: 'Cancelado',
  active: 'Activo',
  inactive: 'Inactivo',
};

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    return STATUS_LABELS[value] ?? value;
  }
}
