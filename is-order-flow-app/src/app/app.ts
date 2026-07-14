import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './features/auth/application/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.initializeAuth();
  }
}
