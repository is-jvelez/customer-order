import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Customer, CreateCustomerRequest } from '../../../domain/models/customer.model';
import { CustomerService } from '../../../application/services/customer.service';
import { NotificationService } from '../../../../../shared/services/notification.service';

export interface CustomerFormDialogData {
  customer?: Customer;
  currentPage: number;
}

@Component({
  selector: 'app-customer-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.customer ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="customer-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>El email es requerido</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Ingresa un email válido</mat-error>
          }
          @if (emailDuplicateError()) {
            <mat-error>Este email ya está en uso</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono (opcional)</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dirección (opcional)</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="submit()"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class CustomerFormComponent {
  protected readonly data = inject<CustomerFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  private readonly customerService = inject(CustomerService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly emailDuplicateError = signal(false);

  protected readonly form = this.fb.group({
    name: [this.data.customer?.name ?? '', Validators.required],
    email: [this.data.customer?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data.customer?.phone ?? ''],
    address: [this.data.customer?.address ?? ''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.emailDuplicateError.set(false);

    const payload: CreateCustomerRequest = {
      name: this.form.value.name!,
      email: this.form.value.email!,
      phone: this.form.value.phone || null,
      address: this.form.value.address || null,
    };

    const obs$ = this.data.customer
      ? this.customerService.update(this.data.customer.id, payload)
      : this.customerService.create(payload);

    obs$.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success(this.data.customer ? 'Cliente actualizado' : 'Cliente creado');
          this.dialogRef.close(true);
        } else {
          this.notify.error(res.message || 'Error al guardar');
        }
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 409) {
          this.emailDuplicateError.set(true);
          this.form.get('email')?.setErrors({ duplicate: true });
        } else {
          this.notify.error('Error al guardar el cliente');
        }
      },
    });
  }
}
