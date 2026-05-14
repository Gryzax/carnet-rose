export const nowIso = (): string => new Date().toISOString();

export const secondsBetween = (fromIso: string, to: Date = new Date()): number =>
  Math.floor((to.getTime() - new Date(fromIso).getTime()) / 1000);
