import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../../../features/auth/application/store/auth.store';
import { AuthService } from '../../../../features/auth/application/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="navbar">
      <button mat-icon-button (click)="toggleSidebar.emit()" aria-label="Alternar menú lateral">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="spacer"></span>
      <button mat-button [matMenuTriggerFor]="userMenu" aria-label="Menú de usuario">
        <mat-icon>account_circle</mat-icon>
        <span class="user-email">{{ authStore.userEmail() }}</span>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .navbar { background-color: #1565C0; color: white; }
    .spacer { flex: 1; }
    .user-email { margin-left: 8px; font-size: 14px; }
    mat-icon { color: white; }
  `],
})
export class NavbarComponent {
  readonly toggleSidebar = output<void>();
  protected readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
