import { describe, it, expect } from 'vitest';
import { add } from '../src/index.js';

describe('Basic sanity test', () => {
  it('should add 1 + 2 and return 3', () => {
    expect(add(1, 2)).toBe(3);
  });
});