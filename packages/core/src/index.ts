// @plantbase/core — az agent-logika háza (LLM-hívás, runSql tool, séma-kontextus, naplózás).
// Az egyes felelősségek külön fájlokba kerülnek a B fázisokban; ez a publikus belépési pont.

/**
 * Ideiglenes egészség-jelző, hogy az A1 fázisban legyen mit tesztelni és exportálni.
 * A valódi API (askAgent, runSql) a B2/B3 fázisban kerül ide.
 */
export const corePackageName = (): string => '@plantbase/core';
