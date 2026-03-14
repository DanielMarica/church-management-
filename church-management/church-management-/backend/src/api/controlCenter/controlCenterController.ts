import type { Request, Response } from 'express';
import multer from 'multer';
import { controlCenterRepository } from './controlCenterRepository';
import {
  UpsertFoodRequestSchema,
  CreatePrintRequestSchema,
  UpdatePrintRequestSchema,
} from './controlCenterModel';

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getSingleString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

// ── Food Requests ──────────────────────────────────────────────────────────────

// GET /api/control/food-requests?planning_id=xxx&team_id=yyy&is_admin=true
export async function getFoodRequests(req: Request, res: Response) {
  try {
    const planningId = getSingleString(req.query.planning_id);
    const teamId = getSingleString(req.query.team_id);
    const isAdmin = req.query.is_admin === 'true';

    if (!planningId) return void res.status(400).json({ error: 'planning_id requis' });

    if (isAdmin) {
      const data = await controlCenterRepository.getFoodRequestsByPlanning(planningId);
      return void res.json(data);
    }

    if (!teamId) return void res.status(400).json({ error: 'team_id requis pour un teacher' });
    const data = await controlCenterRepository.getFoodRequestByTeam(teamId, planningId);
    res.json(data ?? null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/control/planning-sessions
export async function getPlanningSessions(req: Request, res: Response) {
  try {
    const data = await controlCenterRepository.getPlanningSessions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/control/food-requests
export async function upsertFoodRequest(req: Request, res: Response) {
  try {
    const parsed = UpsertFoodRequestSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

    const data = await controlCenterRepository.upsertFoodRequest(parsed.data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/control/food-requests/:id
export async function deleteFoodRequest(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });
    await controlCenterRepository.deleteFoodRequest(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── Print Requests ─────────────────────────────────────────────────────────────

// GET /api/control/print-requests?profile_id=xxx&is_admin=true
export async function getPrintRequests(req: Request, res: Response) {
  try {
    const profileId = getSingleString(req.query.profile_id) ?? undefined;
    const isAdmin = req.query.is_admin === 'true';
    const data = await controlCenterRepository.getPrintRequests(profileId, isAdmin);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/control/print-requests (multipart/form-data)
export async function createPrintRequest(req: Request, res: Response) {
  try {
    let fileUrl: string | undefined;

    if (req.file) {
      fileUrl = await controlCenterRepository.uploadPrintFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const parsed = CreatePrintRequestSchema.safeParse({
      ...req.body,
      file_url: fileUrl,
    });
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

    const data = await controlCenterRepository.createPrintRequest(parsed.data);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/control/print-requests/:id
export async function updatePrintRequest(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    const parsed = UpdatePrintRequestSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

    const data = await controlCenterRepository.updatePrintRequest(id, parsed.data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/control/print-requests/:id
export async function deletePrintRequest(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });
    await controlCenterRepository.deletePrintRequest(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
