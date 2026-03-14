import { supabase } from '../../lib/supabase';
import type {
  FoodRequest, UpsertFoodRequestPayload,
  PrintRequest, CreatePrintRequestPayload, UpdatePrintRequestPayload,
} from './controlCenterModel';

export const controlCenterRepository = {

  // ════════════════════════════════════════════════════════════
  // FOOD REQUESTS
  // ════════════════════════════════════════════════════════════

  // Get all food requests for a planning session (admin)
  async getFoodRequestsByPlanning(planningId: string): Promise<FoodRequest[]> {
    const { data, error } = await supabase
      .from('food_requests')
      .select(`
        *,
        team:teams(id, name, color),
        planning:planning(id, scheduled_date),
        submitter:profiles!food_requests_submitted_by_fkey(id, full_name)
      `)
      .eq('planning_id', planningId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Get food request for a specific team+planning (teacher)
  async getFoodRequestByTeam(teamId: string, planningId: string): Promise<FoodRequest | null> {
    const { data, error } = await supabase
      .from('food_requests')
      .select(`
        *,
        team:teams(id, name, color),
        planning:planning(id, scheduled_date),
        submitter:profiles!food_requests_submitted_by_fkey(id, full_name)
      `)
      .eq('team_id', teamId)
      .eq('planning_id', planningId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get latest planning sessions (for selector)
  async getPlanningSessions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('planning')
      .select('id, scheduled_date, team_id')
      .order('scheduled_date', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Upsert food request
  async upsertFoodRequest(payload: UpsertFoodRequestPayload): Promise<FoodRequest> {
    const { data, error } = await supabase
      .from('food_requests')
      .upsert(
        {
          team_id: payload.team_id,
          planning_id: payload.planning_id,
          children_count: payload.children_count,
          submitted_by: payload.submitted_by ?? null,
          notes: payload.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,planning_id' }
      )
      .select(`
        *,
        team:teams(id, name, color),
        planning:planning(id, scheduled_date),
        submitter:profiles!food_requests_submitted_by_fkey(id, full_name)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete food request
  async deleteFoodRequest(id: string): Promise<void> {
    const { error } = await supabase.from('food_requests').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ════════════════════════════════════════════════════════════
  // PRINT REQUESTS
  // ════════════════════════════════════════════════════════════

  // Get all print requests (admin sees all, teacher sees own)
  async getPrintRequests(profileId?: string, isAdmin?: boolean): Promise<PrintRequest[]> {
    let query = supabase
      .from('print_requests')
      .select(`
        *,
        submitter:profiles!print_requests_submitted_by_fkey(id, full_name, avatar_url),
        team:teams(id, name, color)
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin && profileId) {
      query = query.eq('submitted_by', profileId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Create print request
  async createPrintRequest(payload: CreatePrintRequestPayload): Promise<PrintRequest> {
    const { data, error } = await supabase
      .from('print_requests')
      .insert({
        description: payload.description,
        submitted_by: payload.submitted_by ?? null,
        team_id: payload.team_id ?? null,
        file_url: payload.file_url ?? null,
        status: 'pending',
      })
      .select(`
        *,
        submitter:profiles!print_requests_submitted_by_fkey(id, full_name, avatar_url),
        team:teams(id, name, color)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update print request (admin: status + comment)
  async updatePrintRequest(id: string, payload: UpdatePrintRequestPayload): Promise<PrintRequest> {
    const { data, error } = await supabase
      .from('print_requests')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        submitter:profiles!print_requests_submitted_by_fkey(id, full_name, avatar_url),
        team:teams(id, name, color)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete print request
  async deletePrintRequest(id: string): Promise<void> {
    const { error } = await supabase.from('print_requests').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Upload file for print request
  async uploadPrintFile(file: Buffer, filename: string, mimetype: string): Promise<string> {
    const path = `print-requests/${Date.now()}-${filename}`;
    const { error } = await supabase.storage
      .from('lesson-materials')
      .upload(path, file, { contentType: mimetype });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('lesson-materials').getPublicUrl(path);
    return data.publicUrl;
  },
};
