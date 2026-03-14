import { z } from "zod";

export const ChildSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  age: z.number().int().min(0).max(18).optional(),
  gender: z.enum(["male", "female", "other"]),
  team_id: z.string().uuid().nullable(),
  parent_name: z.string().nullable(),
  parent_phone: z.string().nullable(),
  parent_email: z.string().email().nullable(),
  allergies: z.string().nullable(),
  medical_notes: z.string().nullable(),
  special_needs: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  notes: z.string().nullable(),
  photo_url: z.string().url().nullable().optional(), 
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateChildSchema = z.object({
  photo_url: z.string().url().nullable().optional(),
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : YYYY-MM-DD"),
  gender: z.enum(["male", "female", "other"]),
  team_id: z.string().uuid().nullable().optional(),
  parent_name: z.string().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
  parent_email: z.string().email("Email invalide").nullable().optional(),
  allergies: z.string().nullable().optional(),
  medical_notes: z.string().nullable().optional(),
  special_needs: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateChildSchema = CreateChildSchema.partial();

export type Child = z.infer<typeof ChildSchema>;
export type CreateChildPayload = z.infer<typeof CreateChildSchema>;
export type UpdateChildPayload = z.infer<typeof UpdateChildSchema>;
