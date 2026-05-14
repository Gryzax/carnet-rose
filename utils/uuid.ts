// Client-generated identifiers. Every entity gets a UUID at creation time —
// whether it is created online or offline — so the id is stable everywhere and
// the offline outbox can reference it before Supabase ever sees the row.

const globalCrypto: Crypto | undefined =
  typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;

export const uuid = (): string => {
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID();
  // Fallback for runtimes without crypto.randomUUID (older React Native).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};
