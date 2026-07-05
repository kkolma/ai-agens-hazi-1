// Az Anthropic hivatalos kliense (nem nyers HTTP). A kulcsot az ANTHROPIC_API_KEY
// környezeti változóból olvassa (a CLI a gyökér .env-et tölti be dotennel).

import Anthropic from '@anthropic-ai/sdk';

/** A Plantbase agent által használt modell (a felhasználóval egyeztetve). */
export const MODEL = 'claude-sonnet-5';

/**
 * Anthropic kliens fail-fast ellenőrzéssel: ha nincs API-kulcs, beszédes hibát dob,
 * nem pedig egy homályos SDK-hibát a hívás közben.
 */
export const getAnthropicClient = (): Anthropic => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'Hiányzik az ANTHROPIC_API_KEY. Tedd be a .env-be (ANTHROPIC_API_KEY=sk-ant-...), és futtasd újra.',
    );
  }
  return new Anthropic();
};
