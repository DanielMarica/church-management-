import { supabase } from '../../lib/supabase';
import {
  ROLES, ROLE_COUNT,
  type PlanningSession,
  type GeneratePlanningPayload, type ReplaceTeacherPayload,
} from './planningModel';

// ─── Internal types ────────────────────────────────────────────────────────────

interface RawTeamMember {
  id: string;
  profile_id: string;
  cycle_position: number;
  is_active: boolean;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  }[] | {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface NormalizedTeamMember {
  id: string;
  profile_id: string;
  cycle_position: number;
  is_active: boolean;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

function normalizeMembers(raw: RawTeamMember[]): NormalizedTeamMember[] {
  return raw.map((m) => ({
    ...m,
    profile: Array.isArray(m.profile) ? m.profile[0] : m.profile!,
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns all Sundays between start and end dates */
function getSundays(start: Date, end: Date): Date[] {
  const sundays: Date[] = [];
  const current = new Date(start);
  // Advance to first Sunday
  current.setDate(current.getDate() + ((7 - current.getDay()) % 7));
  while (current <= end) {
    sundays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return sundays;
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Repository ────────────────────────────────────────────────────────────────

export const planningRepository = {

  // ── Get all sessions for a team ─────────────────────────────────────────────

  async getSessionsByTeam(teamId: string): Promise<PlanningSession[]> {
    const { data, error } = await supabase
      .from('planning')
      .select('*')
      .eq('team_id', teamId)
      .order('scheduled_date', { ascending: true });

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const planningIds = data.map((p) => p.id);

    const { data: roles, error: rolesErr } = await supabase
      .from('planning_roles')
      .select(`
        id, planning_id, role_position, role_name, profile_id,
        is_replacement, original_profile_id, created_at,
        profile:profiles!planning_roles_profile_id_fkey(id, full_name, email, avatar_url),
        original_profile:profiles!planning_roles_original_profile_id_fkey(id, full_name)
      `)
      .in('planning_id', planningIds)
      .order('role_position');

    if (rolesErr) throw new Error(rolesErr.message);

    const rolesByPlanning = (roles ?? []).reduce<Record<string, any[]>>((acc, r) => {
      if (!acc[r.planning_id]) acc[r.planning_id] = [];
      acc[r.planning_id].push(r);
      return acc;
    }, {});

    return data.map((p) => ({
      ...p,
      roles: rolesByPlanning[p.id] ?? [],
    }));
  },

  // ── Get single session ───────────────────────────────────────────────────────

  async getSessionById(id: string): Promise<PlanningSession | null> {
    const { data, error } = await supabase
      .from('planning')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const { data: roles } = await supabase
      .from('planning_roles')
      .select(`
        id, planning_id, role_position, role_name, profile_id,
        is_replacement, original_profile_id, created_at,
        profile:profiles!planning_roles_profile_id_fkey(id, full_name, email, avatar_url),
        original_profile:profiles!planning_roles_original_profile_id_fkey(id, full_name)
      `)
      .eq('planning_id', id)
      .order('role_position');

    return { ...data, roles: roles ?? [] };
  },

  // ── Generate planning sessions ───────────────────────────────────────────────

  async generatePlanning(payload: GeneratePlanningPayload): Promise<PlanningSession[]> {
    const { team_id, months, start_date } = payload;

    // 1. Get active team members ordered by cycle_position
    const { data: rawMembers, error: membersErr } = await supabase
      .from('team_members')
      .select(`
        id, profile_id, cycle_position, is_active,
        profile:profiles(id, full_name, email, avatar_url)
      `)
      .eq('team_id', team_id)
      .eq('is_active', true)
      .order('cycle_position');

    if (membersErr) throw new Error(membersErr.message);
    if (!rawMembers || rawMembers.length === 0) {
      throw new Error('Aucun membre actif dans cette équipe');
    }

    const teamMembers = normalizeMembers(rawMembers as unknown as RawTeamMember[]);

    if (teamMembers.length < ROLE_COUNT) {
      throw new Error(
        `Il faut au moins ${ROLE_COUNT} membres pour couvrir tous les rôles (actuellement ${teamMembers.length})`
      );
    }

    // 2. Calculate date range
    const startFrom = start_date ? new Date(start_date) : new Date();
    const endDate = new Date(startFrom);
    endDate.setMonth(endDate.getMonth() + months);

    const sundays = getSundays(startFrom, endDate);
    if (sundays.length === 0) throw new Error('Aucun dimanche trouvé dans cette période');

    // 3. Check which sundays already have sessions
    const sundayDates = sundays.map(toISODate);
    const { data: existing } = await supabase
      .from('planning')
      .select('scheduled_date')
      .eq('team_id', team_id)
      .in('scheduled_date', sundayDates);

    const existingDates = new Set((existing ?? []).map((e) => e.scheduled_date));
    const newSundays = sundays.filter((s) => !existingDates.has(toISODate(s)));

    if (newSundays.length === 0) {
      throw new Error('Toutes les sessions sont déjà générées pour cette période');
    }

    // 4. Sort members by cycle_position — this defines their starting role
    const sortedMembers = [...teamMembers].sort((a, b) => a.cycle_position - b.cycle_position);

    // 5. For each sunday, assign ONE role per member
    // Member at index i gets role: (i + weekIndex) % ROLE_COUNT
    // So each week everyone advances by +1 role
    for (let weekIndex = 0; weekIndex < newSundays.length; weekIndex++) {
      const sunday = newSundays[weekIndex];

      // Create planning session
      const { data: session, error: sessionErr } = await supabase
        .from('planning')
        .insert({
          team_id,
          scheduled_date: toISODate(sunday),
          status: 'scheduled',
          title: `Dimanche ${toISODate(sunday)}`,
          start_time: '09:00:00',
          end_time: '12:00:00',
        })
        .select()
        .single();

      if (sessionErr) throw new Error(sessionErr.message);

      // Each member gets a different role — memberIndex determines starting role
      const roleInserts = sortedMembers.slice(0, ROLE_COUNT).map((member, memberIndex) => {
        // memberIndex = position in sorted list (0..7)
        // weekIndex = which week we're generating (rotates everyone by +1 each week)
        const rolePosition = (memberIndex + weekIndex) % ROLE_COUNT;
        const role = ROLES[rolePosition];
        return {
          planning_id: session.id,
          role_position: rolePosition,
          role_name: role.name,
          profile_id: member.profile_id,
          is_replacement: false,
          original_profile_id: null,
        };
      });

      // Sort by role_position for clean display
      roleInserts.sort((a, b) => a.role_position - b.role_position);

      const { error: rolesErr } = await supabase
        .from('planning_roles')
        .insert(roleInserts);

      if (rolesErr) throw new Error(rolesErr.message);
    }

    // 6. Update cycle_position for all members (+newSundays.length weeks forward)
    for (let i = 0; i < Math.min(sortedMembers.length, ROLE_COUNT); i++) {
      const member = sortedMembers[i];
      const newPosition = (member.cycle_position + newSundays.length) % ROLE_COUNT;
      await supabase
        .from('team_members')
        .update({ cycle_position: newPosition })
        .eq('id', member.id);
    }

    return this.getSessionsByTeam(team_id);
  },

  // ── Replace a teacher on a specific role ─────────────────────────────────────

  async replaceTeacher(
    sessionId: string,
    payload: ReplaceTeacherPayload
  ): Promise<PlanningSession> {
    const { role_id, new_profile_id } = payload;

    const { data: role, error: roleErr } = await supabase
      .from('planning_roles')
      .select('*')
      .eq('id', role_id)
      .single();

    if (roleErr || !role) throw new Error('Rôle introuvable');

    const { error: updateErr } = await supabase
      .from('planning_roles')
      .update({
        profile_id: new_profile_id,
        is_replacement: true,
        original_profile_id: role.is_replacement
          ? role.original_profile_id
          : role.profile_id,
      })
      .eq('id', role_id);

    if (updateErr) throw new Error(updateErr.message);

    // Swap cycle positions so replacement takes over the slot in future weeks
    const { data: session } = await supabase
      .from('planning')
      .select('team_id')
      .eq('id', sessionId)
      .single();

    if (session) {
      const { data: originalMember } = await supabase
        .from('team_members')
        .select('id, cycle_position')
        .eq('team_id', session.team_id)
        .eq('profile_id', role.original_profile_id ?? role.profile_id)
        .single();

      const { data: newMember } = await supabase
        .from('team_members')
        .select('id, cycle_position')
        .eq('team_id', session.team_id)
        .eq('profile_id', new_profile_id)
        .single();

      if (originalMember && newMember) {
        await supabase
          .from('team_members')
          .update({ cycle_position: originalMember.cycle_position })
          .eq('id', newMember.id);

        await supabase
          .from('team_members')
          .update({ cycle_position: newMember.cycle_position })
          .eq('id', originalMember.id);
      }
    }

    const updated = await this.getSessionById(sessionId);
    if (!updated) throw new Error('Session introuvable');
    return updated;
  },

  // ── Delete a session ─────────────────────────────────────────────────────────

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ── Get available teachers for replacement ───────────────────────────────────

  async getAvailableTeachers(teamId: string, excludeProfileId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('profile_id, cycle_position, profile:profiles(id, full_name, email, avatar_url)')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .neq('profile_id', excludeProfileId);

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};