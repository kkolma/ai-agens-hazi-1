import { describe, expect, it } from 'vitest';

import { echo } from './echo';

describe('echo', () => {
  it('returns the echoed text when input is valid', () => {
    expect(echo('szia')).toBe('te írtad: szia');
  });

  it('trims surrounding whitespace before echoing', () => {
    expect(echo('  hello  ')).toBe('te írtad: hello');
  });

  it('throws a speaking error when input is empty', () => {
    expect(() => echo('')).toThrowError('Az input nem lehet üres.');
  });

  it('throws when input is not a string', () => {
    expect(() => echo(42)).toThrowError();
  });
});
