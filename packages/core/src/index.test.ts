import { describe, expect, it } from 'vitest';

import { corePackageName } from './index';

describe('corePackageName', () => {
  it('returns the package name when called', () => {
    expect(corePackageName()).toBe('@plantbase/core');
  });
});
