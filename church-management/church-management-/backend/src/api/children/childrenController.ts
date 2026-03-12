import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateChildSchema, UpdateChildSchema } from "./childrenModel";
import * as childrenRepository from "./childrenRepository";

function getRouteId(param: string | string[] | undefined): string | null {
  if (typeof param === "string" && param.trim().length > 0) return param;
  return null;
}

export async function listChildren(req: Request, res: Response) {
  const { search } = req.query;

  const children = search
    ? await childrenRepository.searchChildren(String(search))
    : await childrenRepository.getAllChildren();

  res.status(StatusCodes.OK).json(children);
}

export async function getChild(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  const child = await childrenRepository.getChildById(id);

  if (!child) {
    res.status(StatusCodes.NOT_FOUND).json({ error: "Enfant non trouvé" });
    return;
  }

  res.status(StatusCodes.OK).json(child);
}

export async function createChild(req: Request, res: Response) {
  const parsed = CreateChildSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Données invalides",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const child = await childrenRepository.createChild(parsed.data);
  res.status(StatusCodes.CREATED).json(child);
}

export async function updateChild(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  const parsed = UpdateChildSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "Données invalides",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const child = await childrenRepository.updateChild(id, parsed.data);

  if (!child) {
    res.status(StatusCodes.NOT_FOUND).json({ error: "Enfant non trouvé" });
    return;
  }

  res.status(StatusCodes.OK).json(child);
}

export async function deleteChild(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "ID invalide" });
    return;
  }

  await childrenRepository.deleteChild(id);
  res.status(StatusCodes.NO_CONTENT).send();
}
