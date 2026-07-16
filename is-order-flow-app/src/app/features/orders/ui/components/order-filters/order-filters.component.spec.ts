import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OrderFiltersComponent } from './order-filters.component';
import { OrderPriority } from '../../../../../shared/constants/app.constants';

describe('OrderFiltersComponent — dropdown de Prioridad (CR-001)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFiltersComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  it('emite el filtro "priority" cuando se selecciona una prioridad', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;

    let emitted: unknown = null;
    instance.filtersChanged.subscribe((v: unknown) => (emitted = v));

    instance.form.get('priority')?.setValue(OrderPriority.High);
    instance.applyFilters();

    expect((emitted as any).priority).toBe(OrderPriority.High);
  });

  it('no incluye "priority" cuando se deja en "Todas" (comportamiento previo intacto)', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;

    let emitted: unknown = null;
    instance.filtersChanged.subscribe((v: unknown) => (emitted = v));

    instance.applyFilters();

    expect((emitted as any).priority).toBeUndefined();
  });

  it('limpiar filtros también resetea "priority" a null', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;

    instance.form.get('priority')?.setValue(OrderPriority.Low);
    instance.clearFilters();

    expect(instance.form.get('priority')?.value).toBeNull();
  });
});
