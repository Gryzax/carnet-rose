import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPref, setPref } from './prefs';
import { useT } from './i18n';

// User-tunable tick/cross reasons.
//
// The app ships a fixed set of default reasons per language (see the
// `tickReasons` / `crossReasons` i18n keys). Teachers can hide defaults they
// never use and add their own custom reasons. Custom reasons are plain strings
// the user typed, so they are kept as-is across languages; hidden defaults are
// stored by index so the choice survives a language switch.

export type ReasonKind = 'tick' | 'cross';

interface ReasonPrefs {
  customTick: string[];
  customCross: string[];
  hiddenTick: number[];
  hiddenCross: number[];
}

const EMPTY_PREFS: ReasonPrefs = {
  customTick: [],
  customCross: [],
  hiddenTick: [],
  hiddenCross: [],
};
const REASON_PREFS_KEY = 'reasonPrefs';

const sanitiseList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const sanitiseIndices = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
    : [];

const parsePrefs = (raw: string | null): ReasonPrefs => {
  if (!raw) return EMPTY_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<ReasonPrefs>;
    return {
      customTick: sanitiseList(parsed.customTick),
      customCross: sanitiseList(parsed.customCross),
      hiddenTick: sanitiseIndices(parsed.hiddenTick),
      hiddenCross: sanitiseIndices(parsed.hiddenCross),
    };
  } catch {
    return EMPTY_PREFS;
  }
};

export interface DefaultReason {
  index: number;
  label: string;
  hidden: boolean;
}

export interface ReasonsContextValue {
  ready: boolean;
  // Resolved pickers: visible defaults followed by custom reasons.
  tickReasons: string[];
  crossReasons: string[];
  // Editor views.
  defaultReasons: (kind: ReasonKind) => DefaultReason[];
  customReasons: (kind: ReasonKind) => string[];
  // Mutators.
  addCustom: (kind: ReasonKind, label: string) => void;
  removeCustom: (kind: ReasonKind, label: string) => void;
  renameCustom: (kind: ReasonKind, previous: string, next: string) => void;
  toggleDefault: (kind: ReasonKind, index: number) => void;
}

const ReasonsContext = createContext<ReasonsContextValue | null>(null);

const customKey = (kind: ReasonKind): 'customTick' | 'customCross' =>
  kind === 'tick' ? 'customTick' : 'customCross';
const hiddenKey = (kind: ReasonKind): 'hiddenTick' | 'hiddenCross' =>
  kind === 'tick' ? 'hiddenTick' : 'hiddenCross';

export const ReasonsProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useT();
  const [prefs, setPrefs] = useState<ReasonPrefs>(EMPTY_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let stored: string | null;
      try {
        stored = await getPref(REASON_PREFS_KEY);
      } catch {
        stored = null;
      }
      if (!active) return;
      setPrefs(parsePrefs(stored));
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist after every change. We compute the next prefs synchronously so the
  // UI updates instantly; the write is fire-and-forget like the language pref.
  const update = useCallback((next: ReasonPrefs) => {
    setPrefs(next);
    setPref(REASON_PREFS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const tickDefaults = useMemo(() => (t('tickReasons') as string[]) ?? [], [t]);
  const crossDefaults = useMemo(() => (t('crossReasons') as string[]) ?? [], [t]);

  const defaultsFor = useCallback(
    (kind: ReasonKind) => (kind === 'tick' ? tickDefaults : crossDefaults),
    [tickDefaults, crossDefaults],
  );

  const defaultReasons = useCallback(
    (kind: ReasonKind): DefaultReason[] => {
      const hidden = prefs[hiddenKey(kind)];
      return defaultsFor(kind).map((label, index) => ({
        index,
        label,
        hidden: hidden.includes(index),
      }));
    },
    [prefs, defaultsFor],
  );

  const customReasons = useCallback((kind: ReasonKind) => prefs[customKey(kind)], [prefs]);

  const addCustom = useCallback(
    (kind: ReasonKind, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const key = customKey(kind);
      const list = prefs[key];
      // Ignore exact duplicates (custom list or visible defaults).
      if (list.includes(trimmed) || defaultsFor(kind).includes(trimmed)) return;
      update({ ...prefs, [key]: [...list, trimmed] });
    },
    [prefs, update, defaultsFor],
  );

  const removeCustom = useCallback(
    (kind: ReasonKind, label: string) => {
      const key = customKey(kind);
      update({ ...prefs, [key]: prefs[key].filter((item) => item !== label) });
    },
    [prefs, update],
  );

  const renameCustom = useCallback(
    (kind: ReasonKind, previous: string, next: string) => {
      const trimmed = next.trim();
      if (!trimmed) return;
      const key = customKey(kind);
      update({
        ...prefs,
        [key]: prefs[key].map((item) => (item === previous ? trimmed : item)),
      });
    },
    [prefs, update],
  );

  const toggleDefault = useCallback(
    (kind: ReasonKind, index: number) => {
      const key = hiddenKey(kind);
      const hidden = prefs[key];
      update({
        ...prefs,
        [key]: hidden.includes(index) ? hidden.filter((i) => i !== index) : [...hidden, index],
      });
    },
    [prefs, update],
  );

  const resolved = useCallback(
    (kind: ReasonKind): string[] => {
      const hidden = prefs[hiddenKey(kind)];
      const visibleDefaults = defaultsFor(kind).filter((_, index) => !hidden.includes(index));
      return [...visibleDefaults, ...prefs[customKey(kind)]];
    },
    [prefs, defaultsFor],
  );

  const value = useMemo<ReasonsContextValue>(
    () => ({
      ready,
      tickReasons: resolved('tick'),
      crossReasons: resolved('cross'),
      defaultReasons,
      customReasons,
      addCustom,
      removeCustom,
      renameCustom,
      toggleDefault,
    }),
    [
      ready,
      resolved,
      defaultReasons,
      customReasons,
      addCustom,
      removeCustom,
      renameCustom,
      toggleDefault,
    ],
  );

  return <ReasonsContext.Provider value={value}>{children}</ReasonsContext.Provider>;
};

export const useReasons = (): ReasonsContextValue => {
  const context = useContext(ReasonsContext);
  if (!context) {
    // Safe fallback when used outside a provider (e.g. isolated tests):
    // behave as if no customisations exist.
    return {
      ready: true,
      tickReasons: [],
      crossReasons: [],
      defaultReasons: () => [],
      customReasons: () => [],
      addCustom: () => {},
      removeCustom: () => {},
      renameCustom: () => {},
      toggleDefault: () => {},
    };
  }
  return context;
};
