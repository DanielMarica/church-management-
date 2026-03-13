import { supabase } from '../../lib/supabase';
import type { Teacher, CreateTeacherPayload, UpdateTeacherPayload } from './teachersModel';

export const teachersRepository = {

  async getAllTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email, role, phone, avatar_url, created_at, updated_at
      `)
      .order('full_name');

    if (error) throw new Error(error.message);

    // Get team membership for each profile
    const profileIds = (data ?? []).map((p) => p.id);
    let teamMap: Record<string, { id: string; name: string; color: string | null }> = {};

    if (profileIds.length > 0) {
      const { data: members } = await supabase
        .from('team_members')
        .select('profile_id, team:teams(id, name, color)')
        .in('profile_id', profileIds)
        .eq('is_active', true);

      (members ?? []).forEach((m: any) => {
        if (m.team) teamMap[m.profile_id] = m.team;
      });
    }

    return (data ?? []).map((p) => ({
      ...p,
      team: teamMap[p.id] ?? null,
    }));
  },

  async getTeacherById(id: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, phone, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const { data: member } = await supabase
      .from('team_members')
      .select('team:teams(id, name, color)')
      .eq('profile_id', id)
      .eq('is_active', true)
      .single();

    return {
      ...data,
      team: (member as any)?.team ?? null,
    };
  },

  async updateTeacher(id: string, payload: UpdateTeacherPayload): Promise<Teacher> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...data, team: null };
  },

  async deleteTeacher(id: string): Promise<void> {
    // We don't delete profiles (linked to auth), just remove from teams
    const { error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('profile_id', id);

    if (error) throw new Error(error.message);
  },
};
