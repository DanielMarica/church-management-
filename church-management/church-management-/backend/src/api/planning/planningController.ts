import type { Request, Response } from 'express';
import { planningRepository } from './planningRepository';
import { GeneratePlanningSchema, ReplaceTeacherSchema } from './planningModel';

function getSingleString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

// GET /api/planning?team_id=xxx
export async function getSessions(req: Request, res: Response) {
  try {
    const teamId = getSingleString(req.query.team_id);
    if (!teamId) return void res.status(400).json({ error: 'team_id requis' });

    const sessions = await planningRepository.getSessionsByTeam(teamId);
    res.json(sessions);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/planning/:id
export async function getSession(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    const session = await planningRepository.getSessionById(id);
    if (!session) return void res.status(404).json({ error: 'Session introuvable' });

    res.json(session);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/planning/generate
export async function generatePlanning(req: Request, res: Response) {
  try {
    const parsed = GeneratePlanningSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const sessions = await planningRepository.generatePlanning(parsed.data);
    res.status(201).json(sessions);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// PATCH /api/planning/:id/replace
export async function replaceTeacher(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    const parsed = ReplaceTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const session = await planningRepository.replaceTeacher(id, parsed.data);
    res.json(session);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/planning/:id/available-teachers?exclude=profileId
export async function getAvailableTeachers(req: Request, res: Response) {
  try {
    const sessionId = getSingleString(req.params.id);
    const excludeId = getSingleString(req.query.exclude);
    if (!sessionId || !excludeId) {
      return void res.status(400).json({ error: 'sessionId et exclude requis' });
    }

    const session = await planningRepository.getSessionById(sessionId);
    if (!session) return void res.status(404).json({ error: 'Session introuvable' });

    const teachers = await planningRepository.getAvailableTeachers(session.team_id, excludeId);
    res.json(teachers);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/planning/:id
export async function deleteSession(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    await planningRepository.deleteSession(id);
    res.status(204).send();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
