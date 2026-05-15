import { useQuery } from '@tanstack/react-query';
import { getClassroomStatistics, type StatsPeriod } from '../domain/statisticsController';
import { queryKeys } from '../lib/queryClient';

// The dashboard aggregates classes, students and events, so any write
// invalidates the `statistics` prefix (see `invalidate` in lib/queryClient).
export const useStatistics = (period: StatsPeriod, classId: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.statistics(period, classId),
    queryFn: () => getClassroomStatistics({ period, classId }),
  });

  return { stats: data ?? null, loading: isLoading };
};
