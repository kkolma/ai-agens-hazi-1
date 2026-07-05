// B1 fázis logikája: visszhang (echo), LLM és adatbázis nélkül.
// A validáció a rendszer-határon történik (Zod), fail-fast, beszédes hibaüzenettel.

import { z } from 'zod';

const EchoInput = z.object({
  text: z.string().trim().min(1, 'Az input nem lehet üres.'),
});

/**
 * Visszhangozza a felhasználó szövegét. Megbízhatatlan (unknown) inputot vár,
 * és biztonságosan szűkíti; üres/nem-string inputra beszédes hibát dob.
 */
export const echo = (rawText: unknown): string => {
  const result = EchoInput.safeParse({ text: rawText });
  if (!result.success) {
    // A legelső issue rövid, olvasható üzenetét adjuk vissza (nem a teljes JSON-t).
    throw new Error(result.error.issues[0]?.message ?? 'Érvénytelen input.');
  }
  return `te írtad: ${result.data.text}`;
};
