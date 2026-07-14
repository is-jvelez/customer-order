import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DecimalPipe } from '@angular/common';
import { CreateOrderItemRequest } from '../../../domain/models/order-item.model';

@Component({
  selector: 'app-order-items-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="items-section">
      <h3>Items del pedido</h3>
      @for (item of itemsArray.controls; track $index) {
        <div class="item-row" [formGroup]="getItemGroup($index)">
          <mat-form-field appearance="outline" class="desc-field">
            <mat-label>Descripción</mat-label>
            <input matInput formControlName="description" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="num-field">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" min="1" formControlName="quantity" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="num-field">
            <mat-label>Precio</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="price" />
          </mat-form-field>
          <span class="subtotal">$ {{ getSubtotal($index) | number:'1.2-2' }}</span>
          <button mat-icon-button color="warn" (click)="removeItem($index)" [disabled]="itemsArray.length === 1" aria-label="Eliminar item">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      }

      <div class="items-footer">
        <button mat-button type="button" (click)="addItem()">
          <mat-icon>add</mat-icon> Agregar item
        </button>
        <span class="total-label">Total: <strong>$ {{ total() | number:'1.2-2' }}</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .items-section { padding: 8px 0; }
    h3 { font-size: 16px; font-weight: 500; margin: 0 0 12px; }
    .item-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
    .desc-field { flex: 2; min-width: 160px; }
    .num-field { flex: 1; min-width: 80px; }
    .subtotal { min-width: 80px; padding-top: 20px; text-align: right; font-size: 14px; }
    .items-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .total-label { font-size: 16px; }
  `],
})
export class OrderItemsFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    items: this.fb.array([this.createItemGroup()]),
  });

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  getItemGroup(index: number) {
    return this.itemsArray.at(index) as ReturnType<typeof this.createItemGroup>;
  }

  getSubtotal(index: number): number {
    const g = this.itemsArray.at(index).value;
    return (Number(g.quantity) || 0) * (Number(g.price) || 0);
  }

  total(): number {
    return this.itemsArray.controls.reduce((sum, _, i) => sum + this.getSubtotal(i), 0);
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getItems(): CreateOrderItemRequest[] {
    return this.itemsArray.value.map((v: { description: string; quantity: number; price: number }) => ({
      description: v.description,
      quantity: Number(v.quantity),
      price: Number(v.price),
    }));
  }

  private createItemGroup() {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
    });
  }
}
