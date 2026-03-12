import { supabase } from "@/lib/supabase";
import type { CreateChildPayload, UpdateChildPayload } from "./childrenModel";

const TABLE = "children" as const;

export async function getAllChildren() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getChildById(id: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data;
}

export async function createChild(payload: CreateChildPayload) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, is_active: true })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateChild(id: string, payload: UpdateChildPayload) {
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
  return data;
}

export async function deleteChild(id: string) {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function searchChildren(query: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .order("last_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}