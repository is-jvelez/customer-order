import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stats-card',
  imports: [MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="stats-card">
      <mat-card-content>
        <div class="card-body">
          <div class="card-icon">
            <mat-icon>{{ icon() }}</mat-icon>
          </div>
          <div class="card-info">
            <span class="card-value">{{ value() }}</span>
            <span class="card-label">{{ label() }}</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stats-card { height: 100%; }
    .card-body { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
    .card-icon { width: 56px; height: 56px; border-radius: 12px; background-color: #E3F2FD; display: flex; align-items: center; justify-content: center; }
    .card-icon mat-icon { color: #1565C0; font-size: 28px; width: 28px; height: 28px; }
    .card-info { display: flex; flex-direction: column; gap: 4px; }
    .card-value { font-size: 28px; font-weight: 600; color: #1A1A2E; line-height: 1; }
    .card-label { font-size: 14px; color: #666; }
  `],
})
export class StatsCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon = input.required<string>();
}
