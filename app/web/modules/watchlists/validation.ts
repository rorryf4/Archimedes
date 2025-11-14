import { z } from 'zod';

// Schema for creating a new watchlist
export const CreateWatchlistInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export type CreateWatchlistInput = z.infer<typeof CreateWatchlistInputSchema>;

// Schema for updating watchlist metadata
export const UpdateWatchlistInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export type UpdateWatchlistInput = z.infer<typeof UpdateWatchlistInputSchema>;

// Schema for adding a token to watchlist
export const AddTokenInputSchema = z.object({
  tokenId: z.string().min(1, 'Token ID is required'),
});

export type AddTokenInput = z.infer<typeof AddTokenInputSchema>;

// Schema for adding a market to watchlist
export const AddMarketInputSchema = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
});

export type AddMarketInput = z.infer<typeof AddMarketInputSchema>;

// Schema for removing an item from watchlist
export const RemoveItemInputSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

export type RemoveItemInput = z.infer<typeof RemoveItemInputSchema>;

// Union schema for PATCH operations
export const PatchWatchlistInputSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update-metadata'),
    data: UpdateWatchlistInputSchema,
  }),
  z.object({
    action: z.literal('add-token'),
    data: AddTokenInputSchema,
  }),
  z.object({
    action: z.literal('add-market'),
    data: AddMarketInputSchema,
  }),
  z.object({
    action: z.literal('remove-item'),
    data: RemoveItemInputSchema,
  }),
]);

export type PatchWatchlistInput = z.infer<typeof PatchWatchlistInputSchema>;
