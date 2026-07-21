import { supabase, region } from '@/lib/supabase/client';
import type { Notebook } from '@/types';

function formatNotebookError(error: { message: string; code?: string }): string {
  if (error.code === 'PGRST301' || error.message.includes('JWT')) {
    return '登录已过期，请重新登录';
  }
  return error.message || '加载笔记本失败';
}

export async function fetchNotebooks(userId: string): Promise<Notebook[]> {
  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', userId)
    .eq('region', region)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatNotebookError(error));
  return (data ?? []) as Notebook[];
}

export async function createNotebook(
  userId: string,
  name: string,
): Promise<Notebook> {
  const { data, error } = await supabase
    .from('notebooks')
    .insert({ user_id: userId, name, region })
    .select()
    .single();

  if (error) throw error;
  return data as Notebook;
}

export async function updateNotebook(
  id: string,
  updates: Pick<Notebook, 'name'>,
): Promise<Notebook> {
  const { data, error } = await supabase
    .from('notebooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Notebook;
}

export async function deleteNotebook(id: string): Promise<void> {
  const { error } = await supabase.from('notebooks').delete().eq('id', id);
  if (error) throw error;
}
