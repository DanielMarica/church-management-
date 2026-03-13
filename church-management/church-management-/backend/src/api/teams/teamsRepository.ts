import { supabase } from '../../lib/supabase';
import type { Team, TeamMember, TeamWithMembers, CreateTeamPayload, UpdateTeamPayload, AddMemberPayload } from './teamsModel';

async function getMembersByTeamIds(teamIds: string[]): Promise<Record<string, TeamMember[]>> {
  if (teamIds.length === 0) return {};

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('id, team_id, profile_id, joined_date, is_active, created_at')
    .in('team_id', teamIds)
    .eq('is_active', true);

  if (membersError) throw new Error(membersError.message);

  const profileIds = Array.from(new Set((members ?? []).map((member) => member.profile_id)));
  const profilesMap = new Map<string, TeamMember['profile']>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .in('id', profileIds);

    if (profilesError) throw new Error(profilesError.message);

    (profiles ?? []).forEach((profile) => {
      profilesMap.set(profile.id, profile);
    });
  }

  const groupedMembers: Record<string, TeamMember[]> = {};
  (members ?? []).forEach((member) => {
    const teamId = member.team_id;
    if (!groupedMembers[teamId]) groupedMembers[teamId] = [];
    groupedMembers[teamId].push({
      ...member,
      profile: profilesMap.get(member.profile_id),
    });
  });

  return groupedMembers;
}

export const teamsRepository = {
  // ─── Teams CRUD ──────────────────────────────────────────────────────────────

  async getAllTeams(): Promise<TeamWithMembers[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(error.message);

    const teamIds = (data ?? []).map((team) => team.id);
    const membersByTeam = await getMembersByTeamIds(teamIds);

    // Count children per team
    let childrenCounts: Record<string, number> = {};

    if (teamIds.length > 0) {
      const { data: children } = await supabase
        .from('children')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('is_active', true);

      (children ?? []).forEach((c) => {
        if (c.team_id) childrenCounts[c.team_id] = (childrenCounts[c.team_id] ?? 0) + 1;
      });
    }

    return (data ?? []).map((t) => ({
      ...t,
      members: membersByTeam[t.id] ?? [],
      children_count: childrenCounts[t.id] ?? 0,
    }));
  },

  async getTeamById(id: string): Promise<TeamWithMembers | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    if (!data) return null;

    const membersByTeam = await getMembersByTeamIds([id]);

    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('team_id', id)
      .eq('is_active', true);

    return {
      ...data,
      members: membersByTeam[id] ?? [],
      children_count: children?.length ?? 0,
    };
  },

  async getTeamByProfileId(profileId: string): Promise<TeamWithMembers | null> {
    // Find the team this profile belongs to
    const { data: membership, error: mErr } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .single();

    if (mErr || !membership) return null;
    return this.getTeamById(membership.team_id);
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateTeam(id: string, payload: UpdateTeamPayload): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ─── Members ─────────────────────────────────────────────────────────────────

  async addMember(teamId: string, payload: AddMemberPayload): Promise<void> {
    // Upsert in case the member was previously removed
    const { error } = await supabase
      .from('team_members')
      .upsert({
        team_id: teamId,
        profile_id: payload.profile_id,
        joined_date: payload.joined_date ?? new Date().toISOString().split('T')[0],
        is_active: true,
      }, { onConflict: 'team_id,profile_id' });

    if (error) throw new Error(error.message);
  },

  async removeMember(teamId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('team_id', teamId)
      .eq('profile_id', profileId);

    if (error) throw new Error(error.message);
  },

  // ─── Profiles (for member picker) ────────────────────────────────────────────

  async getAllProfiles(): Promise<{ id: string; full_name: string; email: string; role: string }[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
