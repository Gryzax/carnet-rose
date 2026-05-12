import { useCallback, useEffect, useState } from 'react';
import { getArchives, getCurrentHistory } from '../models/historyModel';

export const useHistory = (student) => {
  const [history, setHistory] = useState([]);
  const [archives, setArchives] = useState([]);
  const refresh = useCallback(async () => {
    if (!student?.id) return;
    setHistory(await getCurrentHistory(student.id, student.trimestreActuel));
    setArchives(await getArchives(student.id));
  }, [student?.id, student?.trimestreActuel]);
  useEffect(() => { refresh(); }, [refresh]);
  return { history, archives, refresh };
};
