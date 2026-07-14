import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../application/services/auth.service';
import { AuthStore } from '../../../application/store/auth.store';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Iniciar Sesión</mat-card-title>
          <mat-card-subtitle>OrderFlow App</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>El email es requerido</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Ingresa un email válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>La contraseña es requerida</mat-error>
              }
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <mat-error>Mínimo 6 caracteres</mat-error>
              }
            </mat-form-field>

            @if (authStore.error()) {
              <p class="error-message" role="alert">{{ authStore.error() }}</p>
            }

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="full-width submit-btn"
              [disabled]="form.invalid || authStore.loading()"
            >
              @if (authStore.loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Ingresar
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p class="register-link">
            ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #F5F7FA; }
    .auth-card { width: 100%; max-width: 400px; padding: 16px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 16px; height: 44px; }
    .error-message { color: #D32F2F; font-size: 14px; margin-bottom: 8px; }
    .register-link { text-align: center; font-size: 14px; }
    .register-link a { color: #1565C0; text-decoration: none; font-weight: 500; }
  `],
})
export class LoginComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! });
  }
}
