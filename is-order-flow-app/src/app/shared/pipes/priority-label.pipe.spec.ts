import { PriorityLabelPipe } from './priority-label.pipe';
import { OrderPriority } from '../constants/app.constants';

describe('PriorityLabelPipe', () => {
  let pipe: PriorityLabelPipe;

  beforeEach(() => {
    pipe = new PriorityLabelPipe();
  });

  it('maps OrderPriority.Low (1) to "Baja"', () => {
    expect(pipe.transform(OrderPriority.Low)).toBe('Baja');
    expect(pipe.transform(1)).toBe('Baja');
  });

  it('maps OrderPriority.Medium (2) to "Media"', () => {
    expect(pipe.transform(OrderPriority.Medium)).toBe('Media');
    expect(pipe.transform(2)).toBe('Media');
  });

  it('maps OrderPriority.High (3) to "Alta"', () => {
    expect(pipe.transform(OrderPriority.High)).toBe('Alta');
    expect(pipe.transform(3)).toBe('Alta');
  });

  it('falls back to the raw value for an unknown priority (no invented label)', () => {
    expect(pipe.transform(99)).toBe('99');
  });
});
