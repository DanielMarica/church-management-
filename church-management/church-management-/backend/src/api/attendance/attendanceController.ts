import type { Request, Response } from 'express';
import { attendanceRepository } from './attendanceRepository';
import { UpsertAttendanceSchema, BulkAbsentSchema } from './attendanceModel';

function getSingleString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

// GET /api/attendance?planning_id=xxx
export async function getByPlanning(req: Request, res: Response) {
  try {
    const planningId = getSingleString(req.query.planning_id);
    if (!planningId) return void res.status(400).json({ error: 'planning_id requis' });

    const session = await attendanceRepository.getByPlanning(planningId);
    res.json(session);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/attendance/sessions?team_id=xxx
export async function getSessions(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.query.team_id);
    if (!teamId) return void res.status(400).json({ error: 'team_id requis' });

    const sessions = await attendanceRepository.getSessionsList(teamId);
    res.json(sessions);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/attendance
export async function upsertAttendance(req: Request, res: Response) {
  try {
    const parsed = UpsertAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const record = await attendanceRepository.upsert(parsed.data);
    res.json(record);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/attendance/mark-all-absent
export async function markAllAbsent(req: Request, res: Response) {
  try {
    const parsed = BulkAbsentSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const result = await attendanceRepository.markAllAbsent(parsed.data);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
