import { z } from 'zod';

// ─── Role cycle ────────────────────────────────────────────────────────────────

export const ROLES = [
  { position: 0, name: 'Prière',            key: 'prayer' },
  { position: 1, name: 'Chansons',           key: 'songs' },
  { position: 2, name: 'Pause',              key: 'break1' },
  { position: 3, name: 'Leçon biblique + Jeux', key: 'bible_lesson' },
  { position: 4, name: 'Pause',              key: 'break2' },
  { position: 5, name: 'Leçon missionnaire', key: 'mission_lesson' },
  { position: 6, name: 'Verset',             key: 'verse' },
  { position: 7, name: 'Pause',              key: 'break3' },
] as const;

export const ROLE_COUNT = ROLES.length; // 8

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlanningRole {
  id: string;
  planning_id: string;
  role_position: number;
  role_name: string;
  profile_id: string | null;
  is_replacement: boolean;
  original_profile_id: string | null;
  created_at: string;
  // joined
  profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  original_profile?: {
    id: string;
    full_name: string;
  } | null;
}

export interface PlanningSession {
  id: string;
  team_id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  roles: PlanningRole[];
}

export interface TeamMemberWithCycle {
  id: string;
  profile_id: string;
  cycle_position: number;
  is_active: boolean;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

export const GeneratePlanningSchema = z.object({
  team_id: z.string().uuid('team_id invalide'),
  months: z.number().int().min(1).max(12).default(3),
  start_date: z.string().optional(), // ISO date, defaults to next sunday
});

export const ReplaceTeacherSchema = z.object({
  role_id: z.string().uuid('role_id invalide'),
  new_profile_id: z.string().uuid('new_profile_id invalide'),
});

export type GeneratePlanningPayload = z.infer<typeof GeneratePlanningSchema>;
export type ReplaceTeacherPayload = z.infer<typeof ReplaceTeacherSchema>;
