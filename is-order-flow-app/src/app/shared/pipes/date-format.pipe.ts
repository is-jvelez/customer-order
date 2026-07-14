import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFormat' })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '-';
    if (format === 'long') {
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('es-ES');
  }
}
