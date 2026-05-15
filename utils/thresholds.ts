import { useSyncExternalStore } from 'react';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { getPref, setPref } from './prefs';

// Tunable rollover thresholds: how many ticks roll up into a merit, how many
// crosses roll up into a detention. Stored as a single JSON blob in the prefs
// table so services and UI share one source of truth — components subscribe via
// `useThresholds`, services read synchronously via `getThresholds`.

const KEY = 'thresholds';
export const THRESHOLD_MIN = 1;
export const THRESHOLD_MAX = 10;

export interface Thresholds {
  ticksForMerit: number;
  crossesForDetention: number;
}

const DEFAULTS: Thresholds = {
  ticksForMerit: TICKS_FOR_MERIT,
  crossesForDetention: CROSSES_FOR_DETENTION,
};

let current: Thresholds = { ...DEFAULTS };
let loaded = false;
const listeners = new Set<() => void>();

const clamp = (n: number, fallback: number): number => {
  const value = Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, value));
};

const sanitise = (raw: Partial<Thresholds> | null | undefined): Thresholds => ({
  ticksForMerit: clamp(Number(raw?.ticksForMerit), DEFAULTS.ticksForMerit),
  crossesForDetention: clamp(Number(raw?.crossesForDetention), DEFAULTS.crossesForDetention),
});

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const getThresholds = (): Thresholds => current;

export const loadThresholds = async (): Promise<void> => {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await getPref(KEY);
    if (!raw) return;
    const next = sanitise(JSON.parse(raw) as Partial<Thresholds>);
    if (
      next.ticksForMerit !== current.ticksForMerit ||
      next.crossesForDetention !== current.crossesForDetention
    ) {
      current = next;
      notify();
    }
  } catch {
    // Keep defaults if storage or JSON parsing fails.
  }
};

export const setThresholds = (patch: Partial<Thresholds>): void => {
  const next = sanitise({ ...current, ...patch });
  if (
    next.ticksForMerit === current.ticksForMerit &&
    next.crossesForDetention === current.crossesForDetention
  ) {
    return;
  }
  current = next;
  notify();
  setPref(KEY, JSON.stringify(current)).catch(() => {});
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): Thresholds => current;

export const useThresholds = (): Thresholds =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
