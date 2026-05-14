import { getClasses } from '../../models/classModel';
import { supabaseRequest } from '../supabase/supabaseClient';

const isoOrNow = (value) => value || new Date().toISOString();

export const mapClassToSupabase = (classe, userId) => ({
  user_id: userId,
  local_id: String(classe.id),
  name: classe.nom,
  created_at: isoOrNow(classe.creeLe),
  updated_at: new Date().toISOString(),
  last_used_at: classe.derniereUtilisation || classe.creeLe || null,
  deleted_at: null
});

export const upsertClass = async ({ classe, user, session }) => {
  if (!classe || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest('/rest/v1/classes?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(mapClassToSupabase(classe, user.id))
  });
};

export const softDeleteClass = async ({ classId, user, session }) => {
  if (!classId || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest(`/rest/v1/classes?user_id=eq.${encodeURIComponent(user.id)}&local_id=eq.${encodeURIComponent(String(classId))}`, {
    method: 'PATCH',
    accessToken: session.accessToken,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });
};

export const syncClasses = async ({ user, session } = {}) => {
  if (!user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  const classes = await getClasses();
  const results = [];
  for (const classe of classes) {
    results.push(await upsertClass({ classe, user, session }));
  }
  const error = results.find((result) => result?.error)?.error || null;
  return { synced: !error, count: classes.length, error };
};
