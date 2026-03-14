// ─── Controller ────────────────────────────────────────────────────────────────

import type { Request, Response } from 'express';
import multer from 'multer';
import { foodStocksRepository } from './foodStocksRepository';
import { CreateFoodStockSchema, UpdateFoodStockSchema, DistributeSchema } from './foodStocksModel';

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function getSingleString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}

export async function getAllStocks(req: Request, res: Response) {
  try {
    res.json(await foodStocksRepository.getAll());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function getStock(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });
    const stock = await foodStocksRepository.getById(id);
    if (!stock) return void res.status(404).json({ error: 'Produit introuvable' });
    res.json(stock);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function createStock(req: Request, res: Response) {
  try {
    let photoUrl: string | undefined;
    if (req.file) {
      photoUrl = await foodStocksRepository.uploadPhoto(
        req.file.buffer, req.file.originalname, req.file.mimetype
      );
    }

    const parsed = CreateFoodStockSchema.safeParse({
      ...req.body,
      packets_count: Number(req.body.packets_count),
      pieces_per_packet: Number(req.body.pieces_per_packet),
      photo_url: photoUrl,
    });
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

    res.status(201).json(await foodStocksRepository.create(parsed.data));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function updateStock(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    let photoUrl: string | undefined;
    if (req.file) {
      photoUrl = await foodStocksRepository.uploadPhoto(
        req.file.buffer, req.file.originalname, req.file.mimetype
      );
    }

    const parsed = UpdateFoodStockSchema.safeParse({
      ...req.body,
      ...(req.body.packets_count !== undefined && { packets_count: Number(req.body.packets_count) }),
      ...(req.body.pieces_per_packet !== undefined && { pieces_per_packet: Number(req.body.pieces_per_packet) }),
      ...(photoUrl && { photo_url: photoUrl }),
    });
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

    res.json(await foodStocksRepository.update(id, parsed.data));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function deleteStock(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });
    await foodStocksRepository.delete(id);
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function getDistributions(req: Request, res: Response) {
  try {
    const planningId = getSingleString(req.query.planning_id);
    if (!planningId) return void res.status(400).json({ error: 'planning_id requis' });
    res.json(await foodStocksRepository.getDistributions(planningId));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function distribute(req: Request, res: Response) {
  try {
    const parsed = DistributeSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
    res.json(await foodStocksRepository.distribute(parsed.data));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
