import { z } from 'zod';

// ─── Food Requests ─────────────────────────────────────────────────────────────

export interface FoodRequest {
  id: string;
  team_id: string;
  planning_id: string;
  children_count: number;
  submitted_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  team?: { id: string; name: string; color: string | null };
  planning?: { id: string; scheduled_date: string };
  submitter?: { id: string; full_name: string };
}

export const UpsertFoodRequestSchema = z.object({
  team_id: z.string().uuid(),
  planning_id: z.string().uuid(),
  children_count: z.number().int().min(0),
  submitted_by: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type UpsertFoodRequestPayload = z.infer<typeof UpsertFoodRequestSchema>;

// ─── Print Requests ────────────────────────────────────────────────────────────

export type PrintStatus = 'pending' | 'printed';

export interface PrintRequest {
  id: string;
  submitted_by: string | null;
  team_id: string | null;
  description: string;
  file_url: string | null;
  status: PrintStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  submitter?: { id: string; full_name: string; avatar_url: string | null };
  team?: { id: string; name: string; color: string | null };
}

export const CreatePrintRequestSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  submitted_by: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  file_url: z.string().optional(),
});

export const UpdatePrintRequestSchema = z.object({
  status: z.enum(['pending', 'printed']).optional(),
  admin_comment: z.string().optional(),
});

export type CreatePrintRequestPayload = z.infer<typeof CreatePrintRequestSchema>;
export type UpdatePrintRequestPayload = z.infer<typeof UpdatePrintRequestSchema>;
