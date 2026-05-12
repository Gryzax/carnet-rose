import { createClass, getClasses } from '../models/classModel';

export const chargerClasses = async (tri = 'alpha') => {
  const classes = await getClasses();
  if (tri === 'recent') return [...classes].sort((a, b) => String(b.derniereUtilisation || '').localeCompare(String(a.derniereUtilisation || '')));
  return classes;
};

export const ajouterClasse = async (nom) => createClass(nom.trim());
