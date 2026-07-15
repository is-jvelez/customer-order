import { PriorityLabelPipe, PriorityChipClassPipe } from './priority-label.pipe';
import { OrderPriority } from '../constants/app.constants';

describe('PriorityLabelPipe', () => {
  const pipe = new PriorityLabelPipe();

  it('maps 1 to "Baja"', () => {
    expect(pipe.transform(OrderPriority.Low)).toBe('Baja');
  });

  it('maps 2 to "Media"', () => {
    expect(pipe.transform(OrderPriority.Medium)).toBe('Media');
  });

  it('maps 3 to "Alta"', () => {
    expect(pipe.transform(OrderPriority.High)).toBe('Alta');
  });
});

describe('PriorityChipClassPipe', () => {
  const pipe = new PriorityChipClassPipe();

  it('maps Baja (1) to the gray/low chip class', () => {
    expect(pipe.transform(OrderPriority.Low)).toBe('chip-priority-low');
  });

  it('maps Media (2) to the yellow/medium chip class', () => {
    expect(pipe.transform(OrderPriority.Medium)).toBe('chip-priority-medium');
  });

  it('maps Alta (3) to the red/high chip class', () => {
    expect(pipe.transform(OrderPriority.High)).toBe('chip-priority-high');
  });
});
