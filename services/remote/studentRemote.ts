import { remoteRequest, type ReadyRemoteContext } from './context';
import { nowIso } from '../../utils/date';
import type { StudentRow } from '../../types/domain';

// Remote (Supabase) data source for students.

interface SupabaseStudent {
  local_id: string;
  class_local_id: string | null;
  first_name: string;
  last_name: string;
  ticks: number | null;
  crosses: number | null;
  merits: number | null;
  detentions: number | null;
  current_term: number | null;
  deleted_at: string | null;
}

export const mapStudentToSupabase = (student: StudentRow, userId: string) => ({
  user_id: userId,
  local_id: student.id,
  class_local_id: student.classId || null,
  first_name: student.firstName,
  last_name: student.lastName,
  ticks: student.ticks || 0,
  crosses: student.crosses || 0,
  merits: student.merits || 0,
  detentions: student.detentions || 0,
  current_term: student.currentTrimester || 1,
  term: student.currentTrimester || 1,
  updated_at: nowIso(),
  deleted_at: null
});

export const mapStudentFromSupabase = (row: SupabaseStudent): StudentRow => ({
  id: row.local_id,
  classId: row.class_local_id || '',
  firstName: row.first_name,
  lastName: row.last_name,
  ticks: row.ticks || 0,
  crosses: row.crosses || 0,
  merits: row.merits || 0,
  detentions: row.detentions || 0,
  currentTrimester: row.current_term || 1
});

export const fetchStudents = async (ctx: ReadyRemoteContext): Promise<StudentRow[]> => {
  const rows = await remoteRequest<SupabaseStudent[]>(
    `/rest/v1/students?user_id=eq.${encodeURIComponent(ctx.user.id)}&deleted_at=is.null&select=local_id,class_local_id,first_name,last_name,ticks,crosses,merits,detentions,current_term,deleted_at`,
    { accessToken: ctx.session.accessToken }
  );
  return (rows || []).map(mapStudentFromSupabase);
};

export const pushStudent = async (ctx: ReadyRemoteContext, student: StudentRow): Promise<void> => {
  await remoteRequest('/rest/v1/students?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: ctx.session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(mapStudentToSupabase(student, ctx.user.id))
  });
};

export const softDeleteStudentRemote = async (
  ctx: ReadyRemoteContext,
  studentId: string
): Promise<void> => {
  await remoteRequest(
    `/rest/v1/students?user_id=eq.${encodeURIComponent(ctx.user.id)}&local_id=eq.${encodeURIComponent(studentId)}`,
    {
      method: 'PATCH',
      accessToken: ctx.session.accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: nowIso(), updated_at: nowIso() })
    }
  );
};
