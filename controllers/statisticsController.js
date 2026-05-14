import { getClasses } from '../models/classModel';
import { getAllStudents } from '../models/studentModel';

export const getStatistics = async () => {
  const [classes, students] = await Promise.all([getClasses(), getAllStudents()]);
  const normalizedClasses = classes.map((classe) => {
    const classStudents = students.filter((student) => student.classeId === classe.id);
    const atRiskCount = classStudents.filter((student) => student.croix > 0 || student.retenues > 0).length;
    return {
      ...classe,
      nombreEleves: Number(classe.nombreEleves || classStudents.length || 0),
      totalMerites: Number(classe.totalMerites || 0),
      totalRetenues: Number(classe.totalRetenues || 0),
      totalCroix: classStudents.reduce((sum, student) => sum + Number(student.croix || 0), 0),
      elevesARisque: atRiskCount
    };
  });
  const totalEleves = students.length;
  const totalMerites = students.reduce((sum, student) => sum + Number(student.merites || 0), 0);
  const totalRetenues = students.reduce((sum, student) => sum + Number(student.retenues || 0), 0);
  const elevesARisque = students.filter((student) => student.croix > 0 || student.retenues > 0).length;

  return {
    totals: { totalEleves, totalMerites, totalRetenues, elevesARisque },
    classes: normalizedClasses,
    topParticipatifs: [...students]
      .filter((student) => Number(student.merites || 0) > 0 || Number(student.ticks || 0) > 0)
      .sort((a, b) => (Number(b.merites || 0) * 4 + Number(b.ticks || 0)) - (Number(a.merites || 0) * 4 + Number(a.ticks || 0)))
      .slice(0, 3),
    topSurveillance: [...students]
      .filter((student) => Number(student.retenues || 0) > 0 || Number(student.croix || 0) > 0)
      .sort((a, b) => (Number(b.retenues || 0) * 4 + Number(b.croix || 0)) - (Number(a.retenues || 0) * 4 + Number(a.croix || 0)))
      .slice(0, 3)
  };
};
