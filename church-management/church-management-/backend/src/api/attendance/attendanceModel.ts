import { z } from 'zod';

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  id: string;
  planning_id: string;
  child_id: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by: string | null;
  recorded_at: string;
  child?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    team_id: string | null;
    allergies: string | null;
    medical_notes: string | null;
    emergency_contact: string | null;
    parent_name: string | null;
    parent_phone: string | null;
  };
}

export interface AttendanceSession {
  planning_id: string;
  scheduled_date: string;
  team_id: string;
  total: number;
  present: number;
  absent: number;
  pending: number;
  records: AttendanceRecord[];
}

export const UpsertAttendanceSchema = z.object({
  planning_id: z.string().uuid(),
  child_id: z.string().uuid(),
  status: z.enum(['present', 'absent']),
  notes: z.string().optional(),
  recorded_by: z.string().uuid().optional(),
});

export const BulkAbsentSchema = z.object({
  planning_id: z.string().uuid(),
  recorded_by: z.string().uuid().optional(),
});

export type UpsertAttendancePayload = z.infer<typeof UpsertAttendanceSchema>;
export type BulkAbsentPayload = z.infer<typeof BulkAbsentSchema>;
