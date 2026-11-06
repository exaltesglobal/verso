import type { Db } from './db.js';

export type PlanName = 'free' | 'pro';
export type BillingPlan = 'pro_monthly' | 'pro_yearly';

export const PLANS = {
  free: {
    features: {
      export_4k: false,
      auto_clips: false,
      speaker_reframe: false,
      // Every plan exports without a watermark.
      watermark_free: true,
      caption_styles_pro: false,
      templates_pro: false,
    },
    limits: {
      auto_clips_per_month: 10,
      max_devices: 1,
      max_export_height: 1080,
    },
  },
  pro: {
    features: {
      export_4k: true,
      auto_clips: true,
      speaker_reframe: true,
      watermark_free: true,
      caption_styles_pro: true,
      templates_pro: true,
    },
    limits: {
      auto_clips_per_month: -1, // -1 means unlimited
      max_devices: 3,
      max_export_height: 2160,
    },
  },
} as const satisfies Record<PlanName, { features: Record<string, boolean>; limits: Record<string, number> }>;

// A cancelled subscription keeps Pro until the end of the paid period. Halted (failed renewals) does not.
const ENTITLED_STATUSES = ['active', 'authenticated', 'pending', 'cancelled'];

export type Entitlements = {
  plan: PlanName;
  billingPlan: BillingPlan | null;
  status: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  expiresAt: string | null;
};

export async function getEntitlements(db: Db, userId: string): Promise<Entitlements> {
  const t = Date.now();
  const sub = await db('subscriptions')
    .where({ user_id: userId })
    .whereIn('status', ENTITLED_STATUSES)
    .andWhere('current_end', '>', t)
    .orderBy('current_end', 'desc')
    .first();
  if (!sub) return { plan: 'free', billingPlan: null, status: null, ...PLANS.free, expiresAt: null };
  return {
    plan: 'pro',
    billingPlan: sub.plan,
    status: sub.status,
    ...PLANS.pro,
    expiresAt: new Date(Number(sub.current_end)).toISOString(),
  };
}

/** Latest subscription of any status, for the account page. */
export async function latestSubscription(db: Db, userId: string) {
  return db('subscriptions').where({ user_id: userId }).orderBy('created_at', 'desc').first();
}
