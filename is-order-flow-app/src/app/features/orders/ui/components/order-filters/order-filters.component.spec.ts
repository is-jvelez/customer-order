import { TestBed } from '@angular/core/testing';
import { OrderFiltersComponent } from './order-filters.component';
import { OrderPriority } from '../../../../../shared/constants/app.constants';
import { OrderFilterParams } from '../../../domain/models/order.model';

describe('OrderFiltersComponent — CR-001 priority filter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrderFiltersComponent] });
  });

  it('emits priority in the filters payload when a priority is selected', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    let emitted: unknown;
    component.filtersChanged.subscribe((v) => (emitted = v));

    component['form'].patchValue({ priority: OrderPriority.High });
    component.applyFilters();

    expect(emitted).toEqual(expect.objectContaining({ priority: OrderPriority.High }));
  });

  it('does not include priority when "Todas" (null) is selected — previous filters unaffected', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    let emitted: OrderFilterParams = {};
    component.filtersChanged.subscribe((v) => (emitted = v));

    component.applyFilters();

    expect(emitted.priority).toBeUndefined();
  });

  it('resets priority to null on clearFilters()', () => {
    const fixture = TestBed.createComponent(OrderFiltersComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component['form'].patchValue({ priority: OrderPriority.Low });
    component.clearFilters();

    expect(component['form'].value.priority).toBeNull();
  });
});
