import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        mode="side"
        [opened]="sidebarOpen()"
        fixedInViewport
        fixedTopGap="64"
        class="sidenav"
      >
        <app-sidebar />
      </mat-sidenav>
      <mat-sidenav-content>
        <app-navbar (toggleSidebar)="toggleSidebar()" />
        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .layout-container { height: 100vh; }
    .sidenav { width: 240px; border-right: none; }
    .main-content { padding: 24px; background-color: #F5F7FA; min-height: calc(100vh - 64px); }
    app-navbar { position: sticky; top: 0; z-index: 100; }
  `],
})
export class MainLayoutComponent {
  protected readonly sidebarOpen = signal(true);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
