import { z } from "zod";

export const CATEGORIES = [
  "jeux",
  "versets",
  "chansons",
  "images",
  "lesson_missionnaire",
  "lesson_biblique",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  jeux: "Jeux",
  versets: "Versets",
  chansons: "Chansons",
  images: "Images",
  lesson_missionnaire: "Leçon missionnaire",
  lesson_biblique: "Leçon biblique",
};

export const CreateLessonStockSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Catégorie invalide" }),
  }),
  age_group: z.string().max(50).nullable().optional(),
  is_public: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export const UpdateLessonStockSchema = CreateLessonStockSchema.partial();

export type CreateLessonStockPayload = z.infer<typeof CreateLessonStockSchema>;
export type UpdateLessonStockPayload = z.infer<typeof UpdateLessonStockSchema>;

export interface LessonStock {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  age_group: string | null;
  file_url: string | null;
  preview_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
