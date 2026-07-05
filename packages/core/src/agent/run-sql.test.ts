import { describe, expect, it } from 'vitest';

import { assertSelectOnly } from './run-sql';

describe('assertSelectOnly', () => {
  it('accepts a plain SELECT and leaves an existing LIMIT untouched', () => {
    expect(assertSelectOnly('SELECT * FROM products LIMIT 5')).toBe(
      'SELECT * FROM products LIMIT 5',
    );
  });

  it('appends a LIMIT when none is present', () => {
    expect(assertSelectOnly('SELECT name FROM products')).toMatch(/LIMIT \d+$/);
  });

  it('strips a trailing semicolon', () => {
    expect(assertSelectOnly('SELECT 1 LIMIT 1;')).toBe('SELECT 1 LIMIT 1');
  });

  it('accepts a WITH ... SELECT (CTE)', () => {
    const sql = 'WITH t AS (SELECT 1 AS n) SELECT n FROM t LIMIT 1';
    expect(assertSelectOnly(sql)).toBe(sql);
  });

  it.each(['INSERT INTO products(name) VALUES (\'x\')', 'UPDATE products SET stock = 0', 'DELETE FROM products', 'DROP TABLE products', 'TRUNCATE products'])(
    'rejects the write/DDL statement: %s',
    (sql) => {
      expect(() => assertSelectOnly(sql)).toThrowError();
    },
  );

  it('rejects a SELECT ... INTO (which writes)', () => {
    expect(() => assertSelectOnly('SELECT * INTO backup FROM products')).toThrowError();
  });

  it('rejects multiple statements separated by a semicolon', () => {
    expect(() => assertSelectOnly('SELECT 1; DROP TABLE products')).toThrowError();
  });

  it('rejects an empty query', () => {
    expect(() => assertSelectOnly('   ')).toThrowError();
  });
});
