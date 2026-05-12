import { useCallback, useEffect, useState } from 'react';
import { getStudentsByClass } from '../models/studentModel';

export const useStudents = (classeId, sort = 'nom') => {
  const [students, setStudents] = useState([]);
  const refresh = useCallback(async () => {
    if (!classeId) return;
    const data = await getStudentsByClass(classeId);
    const sorted = [...data].sort((a, b) => {
      if (sort === 'croix') return b.croix - a.croix;
      if (sort === 'ticks') return b.ticks - a.ticks;
      return a.nom.localeCompare(b.nom);
    });
    setStudents(sorted);
  }, [classeId, sort]);
  useEffect(() => { refresh(); }, [refresh]);
  return { students, refresh };
};
