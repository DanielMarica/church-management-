import { z } from 'zod';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  color: string | null;
  max_capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  joined_date: string | null;
  is_active: boolean;
  created_at: string;
  // joined profile
  profile?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  children_count?: number;
}

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().max(500).optional(),
  age_group: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  max_capacity: z.number().int().positive().optional(),
  is_active: z.boolean().optional().default(true),
});

export const UpdateTeamSchema = CreateTeamSchema.partial();

export const AddMemberSchema = z.object({
  profile_id: z.string().uuid('profile_id invalide'),
  joined_date: z.string().optional(),
});

export type CreateTeamPayload = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamPayload = z.infer<typeof UpdateTeamSchema>;
export type AddMemberPayload = z.infer<typeof AddMemberSchema>;
