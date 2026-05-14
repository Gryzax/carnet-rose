import { useMutation } from '@tanstack/react-query';
import { addClass, deleteClass, markClassUsed, updateClass } from '../domain/classController';
import type { ClassRow } from '../types/domain';

// Class write operations as TanStack mutations. The class repository already
// invalidates the relevant queries after each write, so these stay thin — they
// exist so screens depend on a hook rather than reaching into the domain layer.
export const useClassMutations = () => {
  const create = useMutation({ mutationFn: (name: string) => addClass(name) });

  const rename = useMutation({
    mutationFn: ({ classRow, name }: { classRow: ClassRow | string; name: string }) =>
      updateClass(classRow, name)
  });

  const remove = useMutation({
    mutationFn: (classRow: ClassRow | string) => deleteClass(classRow)
  });

  const markUsed = useMutation({
    mutationFn: (classRow: ClassRow | string) => markClassUsed(classRow)
  });

  return { create, rename, remove, markUsed };
};
