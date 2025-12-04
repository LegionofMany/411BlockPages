import { z } from 'zod';

export const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  goalAmount: z.union([z.number(), z.string()]).transform((v) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error('goalAmount must be > 0');
    return n;
  }),
  deadline: z.string().min(1),
  recipientWallet: z.string().min(1).max(256),
  givingBlockCharityId: z.string().min(1).max(256).optional().or(z.literal('').transform(() => undefined)),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  donationRequests: z.any().optional(),
  featuredCharityId: z.string().max(256).nullable().optional(),
  activeEventId: z.string().max(256).nullable().optional(),
  donationLink: z.string().url().nullable().optional(),
  donationWidgetEmbed: z
    .object({
      widgetId: z.string().max(256).optional(),
      charityId: z.string().max(256).optional(),
    })
    .partial()
    .optional(),
  nftAvatarUrl: z.string().url().optional(),
  telegram: z.string().max(64).optional(),
  twitter: z.string().max(64).optional(),
  discord: z.string().max(64).optional(),
  website: z.string().url().optional(),
  phoneApps: z.union([z.array(z.string()), z.string()]).optional(),
});

export const flagCreateSchema = z.object({
  walletAddress: z.string().min(1).max(256),
  chain: z.string().min(1).max(32),
  reason: z.string().max(1000).optional(),
});

export const ratingCreateSchema = z.object({
  walletAddress: z.string().min(1).max(256),
  chain: z.string().min(1).max(32),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const socialVerifyRequestSchema = z.object({
  platform: z.string().min(1).max(50),
  handle: z.string().min(1).max(100),
});
