// Az agent által hívható toolok Anthropic-definíciói.

import type Anthropic from '@anthropic-ai/sdk';

export const runSqlTool: Anthropic.Tool = {
  name: 'runSql',
  description:
    'Read-only SQL lekérdezés a products növény-katalóguson. CSAK egyetlen SELECT (vagy WITH ... SELECT). ' +
    'Az eredmény sorai JSON-ként térnek vissza. Használd ezt minden adatra vonatkozó kérdésnél.',
  input_schema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'Egyetlen SELECT lekérdezés a products táblán.',
      },
    },
    required: ['sql'],
    additionalProperties: false,
  },
};
