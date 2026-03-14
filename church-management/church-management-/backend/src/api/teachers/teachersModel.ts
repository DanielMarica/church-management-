import { z } from 'zod';

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // joined from team_members
  team?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export const CreateTeacherSchema = z.object({
  full_name: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().max(20).optional(),
  role: z.enum(['admin', 'teacher', 'viewer']).default('teacher'),
});
export const InviteTeacherSchema = z.object({
  email: z.string().email('Email invalide'),
  full_name: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['admin', 'teacher', 'parent']).default('teacher'),
});

export type InviteTeacherPayload = z.infer<typeof InviteTeacherSchema>;

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

export type CreateTeacherPayload = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacherPayload = z.infer<typeof UpdateTeacherSchema>;
