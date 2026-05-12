import { getClasses } from '../models/classModel';
import { getAllStudents } from '../models/studentModel';

export const getStatistics = async () => {
  const [classes, students] = await Promise.all([getClasses(), getAllStudents()]);
  return {
    classes,
    topParticipatifs: [...students].sort((a, b) => (b.merites * 4 + b.ticks) - (a.merites * 4 + a.ticks)).slice(0, 3),
    topSurveillance: [...students].sort((a, b) => (b.retenues * 4 + b.croix) - (a.retenues * 4 + a.croix)).slice(0, 3)
  };
};
