import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getArchives, getCurrentHistory } from '../models/historyModel';
import { refreshHistory } from '../repositories/historyRepository';
import { queryKeys } from '../lib/queryClient';
import type { ArchiveRow, EventRow, StudentRow } from '../types/domain';

interface HistoryData {
  history: EventRow[];
  archives: ArchiveRow[];
}

export const useHistory = (student: StudentRow | null | undefined) => {
  const id = student?.id;
  const trimester = student?.currentTrimester;
  const { data, isLoading, refetch } = useQuery<HistoryData>({
    queryKey: queryKeys.history(id ?? '', trimester ?? 0),
    enabled: id != null,
    queryFn: async () => {
      const [history, archives] = await Promise.all([
        getCurrentHistory(id as string, trimester as number),
        getArchives(id as string)
      ]);
      return { history, archives };
    }
  });

  useEffect(() => {
    void refreshHistory();
  }, []);

  return {
    history: data?.history ?? [],
    archives: data?.archives ?? [],
    loading: isLoading,
    refresh: refetch
  };
};
