import { z } from 'zod';

// ─── Food Stock ────────────────────────────────────────────────────────────────

export type FoodCategory = 'biscuit' | 'bonbon' | 'autre';

export interface FoodStock {
  id: string;
  name: string;
  category: FoodCategory;
  packets_count: number;
  pieces_per_packet: number;
  photo_url: string | null;
  purchased_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // computed
  total_pieces?: number;
}

export const CreateFoodStockSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  category: z.enum(['biscuit', 'bonbon', 'autre']),
  packets_count: z.number().int().min(0),
  pieces_per_packet: z.number().int().min(1),
  purchased_at: z.string().optional(),
  expires_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
  photo_url: z.string().optional(),
});

export const UpdateFoodStockSchema = CreateFoodStockSchema.partial();

// ─── Food Distribution ─────────────────────────────────────────────────────────

export interface FoodDistribution {
  id: string;
  planning_id: string;
  food_stock_id: string;
  packets_used: number;
  pieces_used: number;
  children_count: number;
  distributed_by: string | null;
  created_at: string;
  food_stock?: FoodStock;
}

export interface DistributionBasket {
  planning_id: string;
  children_count: number;
  distributed_by?: string;
  items: {
    food_stock_id: string;
    packets_used: number;
    pieces_used: number;
  }[];
}

export const DistributeSchema = z.object({
  planning_id: z.string().uuid(),
  children_count: z.number().int().min(1),
  distributed_by: z.string().uuid().optional(),
  items: z.array(z.object({
    food_stock_id: z.string().uuid(),
    packets_used: z.number().int().min(0),
    pieces_used: z.number().int().min(0),
  })).min(1, 'Au moins un produit requis'),
});

export type CreateFoodStockPayload = z.infer<typeof CreateFoodStockSchema>;
export type UpdateFoodStockPayload = z.infer<typeof UpdateFoodStockSchema>;
export type DistributePayload = z.infer<typeof DistributeSchema>;
