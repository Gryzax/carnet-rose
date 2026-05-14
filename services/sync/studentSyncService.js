import { getAllStudents } from '../../models/studentModel';
import { supabaseRequest } from '../supabase/supabaseClient';

const splitName = (student) => ({
  firstName: student.prenom || student.first_name || '',
  lastName: student.nom || student.last_name || ''
});

export const mapStudentToSupabase = (student, userId) => {
  const { firstName, lastName } = splitName(student);
  return {
    user_id: userId,
    local_id: String(student.id),
    class_local_id: student.classeId == null ? null : String(student.classeId),
    first_name: firstName,
    last_name: lastName,
    ticks: student.ticks || 0,
    crosses: student.croix || 0,
    merits: student.merites || 0,
    detentions: student.retenues || 0,
    current_term: student.trimestreActuel || 1,
    term: student.trimestreActuel || 1,
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
};

export const upsertStudent = async ({ student, user, session }) => {
  if (!student || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest('/rest/v1/students?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(mapStudentToSupabase(student, user.id))
  });
};

export const softDeleteStudent = async ({ studentId, user, session }) => {
  if (!studentId || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest(`/rest/v1/students?user_id=eq.${encodeURIComponent(user.id)}&local_id=eq.${encodeURIComponent(String(studentId))}`, {
    method: 'PATCH',
    accessToken: session.accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });
};

export const syncStudents = async ({ user, session } = {}) => {
  if (!user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  const students = await getAllStudents();
  const results = [];
  for (const student of students) {
    results.push(await upsertStudent({ student, user, session }));
  }
  const error = results.find((result) => result?.error)?.error || null;
  return { synced: !error, count: students.length, error };
};
