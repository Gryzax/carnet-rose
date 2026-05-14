import { useCallback, useEffect } from 'react';
import { getArchives, getCurrentHistory } from '../models/historyModel';
import { refreshHistory } from '../repositories/historyRepository';
import { useQuery, type StoreKey } from '../store/dataStore';
import type { ArchiveRow, EventRow, StudentRow } from '../types/domain';

const KEYS: StoreKey[] = ['events'];

interface HistoryData {
  history: EventRow[];
  archives: ArchiveRow[];
}

export const useHistory = (student: StudentRow | null | undefined) => {
  const id = student?.id;
  const trimester = student?.currentTrimester;
  const fetcher = useCallback(async (): Promise<HistoryData> => {
    const [history, archives] = await Promise.all([
      getCurrentHistory(id as string, trimester as number),
      getArchives(id as string)
    ]);
    return { history, archives };
  }, [id, trimester]);
  const { data, loading, refresh } = useQuery<HistoryData>(KEYS, fetcher, { enabled: id != null });

  useEffect(() => {
    void refreshHistory();
  }, []);

  return { history: data?.history ?? [], archives: data?.archives ?? [], loading, refresh };
};
