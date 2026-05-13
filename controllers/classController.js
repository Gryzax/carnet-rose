import { createClass, getClasses } from '../models/classModel';

export const chargerClasses = async (tri = 'alpha') => {
  const classes = await getClasses();
  if (tri === 'recent') return [...classes].sort((a, b) => String(b.derniereUtilisation || '').localeCompare(String(a.derniereUtilisation || '')));
  return classes;
};

export const ajouterClasse = async (nom) => {
  const normalizedName = String(nom || '').trim();
  if (!normalizedName) throw new Error('Le nom de la classe est obligatoire.');
  return createClass(normalizedName);
};
