import { supabase } from '../../lib/supabase';
import type {
  AttendanceSession, AttendanceRecord,
  UpsertAttendancePayload, BulkAbsentPayload,
} from './attendanceModel';

export const attendanceRepository = {

  // ── Get attendance for a planning session ─────────────────────────────────
  // Returns ALL children in the team with their attendance status (or 'pending')

  async getByPlanning(planningId: string): Promise<AttendanceSession> {
    // 1. Get the planning session to find team_id and date
    const { data: planning, error: planErr } = await supabase
      .from('planning')
      .select('id, team_id, scheduled_date')
      .eq('id', planningId)
      .single();

    if (planErr || !planning) throw new Error('Session de planning introuvable');

    // 2. Get all active children in this team
    const { data: children, error: childErr } = await supabase
      .from('children')
      .select('id, first_name, last_name, photo_url, team_id, allergies, medical_notes, emergency_contact, parent_name, parent_phone')
      .eq('team_id', planning.team_id)
      .eq('is_active', true)
      .order('last_name');

    if (childErr) throw new Error(childErr.message);

    // 3. Get existing attendance records for this planning
    const { data: records, error: recErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('planning_id', planningId);

    if (recErr) throw new Error(recErr.message);

    const recordMap = new Map<string, AttendanceRecord>(
      (records ?? []).map((r) => [r.child_id, r])
    );

    // 4. Merge: every child gets a record (real or virtual 'pending')
    const allRecords: AttendanceRecord[] = (children ?? []).map((child) => {
      const existing = recordMap.get(child.id);
      if (existing) {
        return { ...existing, child };
      }
      return {
        id: '',
        planning_id: planningId,
        child_id: child.id,
        status: 'pending' as any,
        notes: null,
        recorded_by: null,
        recorded_at: '',
        child,
      };
    });

    const present = allRecords.filter((r) => r.status === 'present').length;
    const absent = allRecords.filter((r) => r.status === 'absent').length;
    const pending = allRecords.filter((r) => r.status === 'pending').length;

    return {
      planning_id: planningId,
      scheduled_date: planning.scheduled_date,
      team_id: planning.team_id,
      total: allRecords.length,
      present,
      absent,
      pending,
      records: allRecords,
    };
  },

  // ── Get attendance sessions list (all sundays with stats) ──────────────────

  async getSessionsList(teamId: string): Promise<any[]> {
    const { data: sessions, error } = await supabase
      .from('planning')
      .select('id, scheduled_date, team_id')
      .eq('team_id', teamId)
      .order('scheduled_date', { ascending: false });

    if (error) throw new Error(error.message);
    if (!sessions || sessions.length === 0) return [];

    const planningIds = sessions.map((s) => s.id);

    const { data: records } = await supabase
      .from('attendance')
      .select('planning_id, status')
      .in('planning_id', planningIds);

    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('team_id', teamId)
      .eq('is_active', true);

    const totalChildren = children?.length ?? 0;

    const statsByPlanning = (records ?? []).reduce<Record<string, Record<string, number>>>((acc, r) => {
      if (!acc[r.planning_id]) acc[r.planning_id] = { present: 0, absent: 0 };
      acc[r.planning_id][r.status] = (acc[r.planning_id][r.status] ?? 0) + 1;
      return acc;
    }, {});

    return sessions.map((s) => {
      const stats = statsByPlanning[s.id] ?? {};
      const present = stats.present ?? 0;
      const absent = stats.absent ?? 0;
      return {
        ...s,
        total: totalChildren,
        present,
        absent,
        pending: totalChildren - present - absent,
      };
    });
  },

  // ── Upsert a single attendance record ─────────────────────────────────────

  async upsert(payload: UpsertAttendancePayload): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        {
          planning_id: payload.planning_id,
          child_id: payload.child_id,
          status: payload.status,
          notes: payload.notes ?? null,
          recorded_by: payload.recorded_by ?? null,
          recorded_at: new Date().toISOString(),
        },
        { onConflict: 'planning_id,child_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── Mark all non-present children as absent ───────────────────────────────

  async markAllAbsent(payload: BulkAbsentPayload): Promise<{ updated: number }> {
    const { planning_id, recorded_by } = payload;

    // Get all children in the team
    const { data: planning } = await supabase
      .from('planning')
      .select('team_id')
      .eq('id', planning_id)
      .single();

    if (!planning) throw new Error('Session introuvable');

    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('team_id', planning.team_id)
      .eq('is_active', true);

    if (!children || children.length === 0) return { updated: 0 };

    // Get already recorded (present or absent)
    const { data: existing } = await supabase
      .from('attendance')
      .select('child_id, status')
      .eq('planning_id', planning_id);

    const presentIds = new Set(
      (existing ?? []).filter((r) => r.status === 'present').map((r) => r.child_id)
    );

    // Find children not marked present
    const toMarkAbsent = children
      .filter((c) => !presentIds.has(c.id))
      .map((c) => ({
        planning_id,
        child_id: c.id,
        status: 'absent' as const,
        recorded_by: recorded_by ?? null,
        recorded_at: new Date().toISOString(),
      }));

    if (toMarkAbsent.length === 0) return { updated: 0 };

    const { error } = await supabase
      .from('attendance')
      .upsert(toMarkAbsent, { onConflict: 'planning_id,child_id' });

    if (error) throw new Error(error.message);

    return { updated: toMarkAbsent.length };
  },
};
