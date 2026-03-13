import type { Request, Response } from 'express';
import { teachersRepository } from './teachersRepository';
import { UpdateTeacherSchema } from './teachersModel';

function getSingleString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

// GET /api/teachers
export async function getTeachers(req: Request, res: Response) {
  try {
    const teachers = await teachersRepository.getAllTeachers();
    res.json(teachers);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/teachers/:id
export async function getTeacher(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    const teacher = await teachersRepository.getTeacherById(id);
    if (!teacher) return void res.status(404).json({ error: 'Professeur introuvable' });

    res.json(teacher);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/teachers/:id
export async function updateTeacher(req: Request, res: Response) {
  try {
    const id = getSingleString(req.params.id);
    if (!id) return void res.status(400).json({ error: 'id invalide' });

    const existing = await teachersRepository.getTeacherById(id);
    if (!existing) return void res.status(404).json({ error: 'Professeur introuvable' });

    const parsed = UpdateTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const teacher = await teachersRepository.updateTeacher(id, parsed.data);
    res.json(teacher);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
