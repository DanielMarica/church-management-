import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { deleteFile, generatePdfPreview, uploadFile } from "@/lib/storage";
import {
  CreateLessonStockSchema,
  UpdateLessonStockSchema,
} from "./lessonStocksModel";
import * as repo from "./lessonStocksRepository";

function getRouteId(param: string | string[] | undefined): string | null {
  if (typeof param === "string" && param.trim().length > 0) return param;
  return null;
}

export async function listLessonStocks(req: Request, res: Response) {
  const { category } = req.query;
  const items = await repo.getAllLessonStocks(category ? String(category) : undefined);
  res.status(StatusCodes.OK).json(items);
}

export async function getLessonStock(req: Request, res: Response) {
  const id = getRouteId(req.params.id);
  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  const item = await repo.getLessonStockById(id);
  if (!item) {
    res.status(StatusCodes.NOT_FOUND).json({ error: "Matériel non trouvé" });
    return;
  }
  res.status(StatusCodes.OK).json(item);
}

export async function createLessonStock(req: Request, res: Response) {
  const parsed = CreateLessonStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Données invalides",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  let file_url: string | null = null;
  let preview_url: string | null = null;

  const file = req.file;
  if (file) {
    file_url = await uploadFile(file.buffer, file.originalname, file.mimetype, "files");

    if (file.mimetype === "application/pdf") {
      preview_url = await generatePdfPreview(file.buffer);
    } else if (file.mimetype.startsWith("image/")) {
      preview_url = file_url;
    }
  }

  const item = await repo.createLessonStock({
    ...parsed.data,
    file_url,
    preview_url,
  });

  res.status(StatusCodes.CREATED).json(item);
}

export async function updateLessonStock(req: Request, res: Response) {
  const id = getRouteId(req.params.id);
  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  const parsed = UpdateLessonStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Données invalides",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const existing = await repo.getLessonStockById(id);
  if (!existing) {
    res.status(StatusCodes.NOT_FOUND).json({ error: "Matériel non trouvé" });
    return;
  }

  let file_url = existing.file_url;
  let preview_url = existing.preview_url;

  const file = req.file;
  if (file) {
    if (existing.file_url) await deleteFile(existing.file_url).catch(() => {});
    if (existing.preview_url && existing.preview_url !== existing.file_url) {
      await deleteFile(existing.preview_url).catch(() => {});
    }

    file_url = await uploadFile(file.buffer, file.originalname, file.mimetype, "files");

    if (file.mimetype === "application/pdf") {
      preview_url = await generatePdfPreview(file.buffer);
    } else if (file.mimetype.startsWith("image/")) {
      preview_url = file_url;
    }
  }

  const item = await repo.updateLessonStock(id, {
    ...parsed.data,
    file_url,
    preview_url,
  });

  res.status(StatusCodes.OK).json(item);
}

export async function deleteLessonStock(req: Request, res: Response) {
  const id = getRouteId(req.params.id);
  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  const existing = await repo.getLessonStockById(id);
  if (!existing) {
    res.status(StatusCodes.NOT_FOUND).json({ error: "Matériel non trouvé" });
    return;
  }

  if (existing.file_url) await deleteFile(existing.file_url).catch(() => {});
  if (existing.preview_url && existing.preview_url !== existing.file_url) {
    await deleteFile(existing.preview_url).catch(() => {});
  }

  await repo.deleteLessonStock(id);
  res.status(StatusCodes.NO_CONTENT).send();
}
