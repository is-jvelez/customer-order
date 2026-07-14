import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sidebar" aria-label="Navegación principal">
      <div class="sidebar-brand">
        <span>OrderFlow</span>
      </div>
      <mat-nav-list>
        @for (item of navItems; track item.route) {
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active-link"
            [attr.aria-label]="item.label"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        }
      </mat-nav-list>
    </nav>
  `,
  styles: [`
    .sidebar {
      background-color: #0D2137;
      color: white;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .sidebar-brand {
      padding: 20px 16px;
      font-size: 20px;
      font-weight: 600;
      color: white;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    mat-nav-list { padding-top: 8px; }
    a[mat-list-item] { color: rgba(255,255,255,0.8) !important; }
    :host ::ng-deep .active-link { background-color: rgba(255,255,255,0.15) !important; color: white !important; }
    mat-icon { color: rgba(255,255,255,0.8) !important; }
  `],
})
export class SidebarComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Clientes', icon: 'group', route: '/customers' },
    { label: 'Pedidos', icon: 'inventory_2', route: '/orders' },
  ];
}
