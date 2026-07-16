import { PriorityLabelPipe } from './priority-label.pipe';
import { OrderPriority } from '../constants/app.constants';

describe('PriorityLabelPipe', () => {
  let pipe: PriorityLabelPipe;

  beforeEach(() => {
    pipe = new PriorityLabelPipe();
  });

  it('mapea 1 (Low) a "Baja"', () => {
    expect(pipe.transform(OrderPriority.Low)).toBe('Baja');
  });

  it('mapea 2 (Medium) a "Media"', () => {
    expect(pipe.transform(OrderPriority.Medium)).toBe('Media');
  });

  it('mapea 3 (High) a "Alta"', () => {
    expect(pipe.transform(OrderPriority.High)).toBe('Alta');
  });

  it('devuelve el valor tal cual si no reconoce la prioridad (fallback seguro)', () => {
    expect(pipe.transform(99)).toBe('99');
  });
});
