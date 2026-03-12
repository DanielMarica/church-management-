import { supabase } from "@/lib/supabase";
import type {
  CreateLessonStockPayload,
  LessonStock,
  UpdateLessonStockPayload,
} from "./lessonStocksModel";

const TABLE = "lesson_stocks" as const;

export async function getAllLessonStocks(category?: string): Promise<LessonStock[]> {
  let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as LessonStock[];
}

export async function getLessonStockById(id: string): Promise<LessonStock | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as LessonStock;
}

export async function createLessonStock(
  payload: CreateLessonStockPayload & {
    file_url?: string | null;
    preview_url?: string | null;
    created_by?: string | null;
  },
): Promise<LessonStock> {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();

  if (error) throw new Error(error.message);
  return data as LessonStock;
}

export async function updateLessonStock(
  id: string,
  payload: UpdateLessonStockPayload & {
    file_url?: string | null;
    preview_url?: string | null;
  },
): Promise<LessonStock | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as LessonStock;
}

export async function deleteLessonStock(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw new Error(error.message);
}
