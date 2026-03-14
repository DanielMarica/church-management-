import { supabase } from '../../lib/supabase';
import type {
  FoodStock, CreateFoodStockPayload, UpdateFoodStockPayload,
  FoodDistribution, DistributePayload,
} from './foodStocksModel';

function withTotalPieces(stock: any): FoodStock {
  return {
    ...stock,
    total_pieces: stock.packets_count * stock.pieces_per_packet,
  };
}

export const foodStocksRepository = {

  // ── Get all stocks ───────────────────────────────────────────────────────────

  async getAll(): Promise<FoodStock[]> {
    const { data, error } = await supabase
      .from('food_stocks')
      .select('*')
      .order('expires_at', { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(withTotalPieces);
  },

  // ── Get single stock ─────────────────────────────────────────────────────────

  async getById(id: string): Promise<FoodStock | null> {
    const { data, error } = await supabase
      .from('food_stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data ? withTotalPieces(data) : null;
  },

  // ── Create stock ─────────────────────────────────────────────────────────────

  async create(payload: CreateFoodStockPayload): Promise<FoodStock> {
    const { data, error } = await supabase
      .from('food_stocks')
      .insert({
        name: payload.name,
        category: payload.category,
        packets_count: payload.packets_count,
        pieces_per_packet: payload.pieces_per_packet,
        photo_url: payload.photo_url ?? null,
        purchased_at: payload.purchased_at ?? null,
        expires_at: payload.expires_at ?? null,
        created_by: payload.created_by ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return withTotalPieces(data);
  },

  // ── Update stock ─────────────────────────────────────────────────────────────

  async update(id: string, payload: UpdateFoodStockPayload): Promise<FoodStock> {
    const { data, error } = await supabase
      .from('food_stocks')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return withTotalPieces(data);
  },

  // ── Delete stock ─────────────────────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('food_stocks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ── Upload photo ─────────────────────────────────────────────────────────────

  async uploadPhoto(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
    const path = `products/${Date.now()}-${filename}`;
    const { error } = await supabase.storage
      .from('food-stocks')
      .upload(path, buffer, { contentType: mimetype });

    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('food-stocks').getPublicUrl(path);
    return data.publicUrl;
  },

  // ── Get distributions for a planning session ─────────────────────────────────

  async getDistributions(planningId: string): Promise<FoodDistribution[]> {
    const { data, error } = await supabase
      .from('food_distributions')
      .select('*, food_stock:food_stocks(*)')
      .eq('planning_id', planningId)
      .order('created_at');

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Distribute (panier) — deducts from stock ─────────────────────────────────

  async distribute(payload: DistributePayload): Promise<FoodDistribution[]> {
    const { planning_id, children_count, distributed_by, items } = payload;

    // 1. Verify stock availability for each item
    for (const item of items) {
      const stock = await this.getById(item.food_stock_id);
      if (!stock) throw new Error(`Produit ${item.food_stock_id} introuvable`);

      const totalPacketsNeeded = item.packets_used;
      if (totalPacketsNeeded > stock.packets_count) {
        throw new Error(
          `Stock insuffisant pour "${stock.name}": ${stock.packets_count} paquet(s) disponible(s), ${totalPacketsNeeded} demandé(s)`
        );
      }
    }

    // 2. Delete previous distributions for this planning (replace basket)
    await supabase.from('food_distributions').delete().eq('planning_id', planning_id);

    // 3. Insert new distributions + deduct stock
    const created: FoodDistribution[] = [];

    for (const item of items) {
      if (item.packets_used === 0 && item.pieces_used === 0) continue;

      // Insert distribution record
      const { data, error } = await supabase
        .from('food_distributions')
        .insert({
          planning_id,
          food_stock_id: item.food_stock_id,
          packets_used: item.packets_used,
          pieces_used: item.pieces_used,
          children_count,
          distributed_by: distributed_by ?? null,
        })
        .select('*, food_stock:food_stocks(*)')
        .single();

      if (error) throw new Error(error.message);
      created.push(data);

      // Deduct from stock
      const stock = await this.getById(item.food_stock_id);
      if (stock) {
        const newPackets = Math.max(0, stock.packets_count - item.packets_used);
        await supabase
          .from('food_stocks')
          .update({ packets_count: newPackets, updated_at: new Date().toISOString() })
          .eq('id', item.food_stock_id);
      }
    }

    return created;
  },
};
