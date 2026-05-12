import { useCallback, useEffect, useState } from 'react';
import { chargerClasses } from '../controllers/classController';

export const useClasses = (sort = 'alpha') => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    setClasses(await chargerClasses(sort));
    setLoading(false);
  }, [sort]);
  useEffect(() => { refresh(); }, [refresh]);
  return { classes, loading, refresh };
};
