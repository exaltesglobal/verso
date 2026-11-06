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
      background_pro: false,
      dubbing: false,
    },
    limits: {
      auto_clips_per_month: 0, // auto clips are Pro
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
      background_pro: true,
      dubbing: true,
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
  /** True when an admin override changed the plan, a feature or a limit. */
  overridden: boolean;
};

export const FEATURE_IDS = Object.keys(PLANS.pro.features);
export const LIMIT_IDS = Object.keys(PLANS.pro.limits);

export type Override = {
  plan_override: PlanName | null;
  expires_at: number | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  note: string | null;
  granted_by: string | null;
};

const parseJson = <T>(v: unknown, fallback: T): T => {
  try {
    return v ? (JSON.parse(String(v)) as T) : fallback;
  } catch {
    return fallback;
  }
};

export async function getOverride(db: Db, userId: string): Promise<Override | null> {
  const r = await db('user_overrides').where({ user_id: userId }).first();
  if (!r) return null;
  return {
    plan_override: r.plan_override === 'pro' || r.plan_override === 'free' ? r.plan_override : null,
    expires_at: r.expires_at == null ? null : Number(r.expires_at),
    features: parseJson(r.features, {}),
    limits: parseJson(r.limits, {}),
    note: r.note ?? null,
    granted_by: r.granted_by ?? null,
  };
}

/** Subscription plan, then an unexpired admin plan override, then per-feature and per-limit overrides. */
export async function getEntitlements(db: Db, userId: string): Promise<Entitlements> {
  const t = Date.now();
  const [sub, ov] = await Promise.all([
    db('subscriptions')
      .where({ user_id: userId })
      .whereIn('status', ENTITLED_STATUSES)
      .andWhere('current_end', '>', t)
      .orderBy('current_end', 'desc')
      .first(),
    getOverride(db, userId),
  ]);
  let ent: Entitlements = sub
    ? { plan: 'pro', billingPlan: sub.plan, status: sub.status, ...PLANS.pro, expiresAt: new Date(Number(sub.current_end)).toISOString(), overridden: false }
    : { plan: 'free', billingPlan: null, status: null, ...PLANS.free, expiresAt: null, overridden: false };
  if (!ov) return ent;

  if (ov.plan_override && (ov.expires_at == null || ov.expires_at > t)) {
    const plan = ov.plan_override;
    // Comp Pro ends at the override date, or never; a paid period that runs longer still wins.
    const expiresAt =
      plan === 'free'
        ? null
        : ov.expires_at == null
          ? null
          : new Date(Math.max(ov.expires_at, sub ? Number(sub.current_end) : 0)).toISOString();
    ent = { ...ent, plan, ...PLANS[plan], expiresAt, overridden: true };
  }
  const features = Object.fromEntries(Object.entries(ov.features).filter(([k, v]) => FEATURE_IDS.includes(k) && typeof v === 'boolean'));
  const limits = Object.fromEntries(Object.entries(ov.limits).filter(([k, v]) => LIMIT_IDS.includes(k) && Number.isInteger(v)));
  if (Object.keys(features).length || Object.keys(limits).length) {
    ent = { ...ent, features: { ...ent.features, ...features }, limits: { ...ent.limits, ...limits }, overridden: true };
  }
  return ent;
}

/** Latest subscription of any status, for the account page. */
export async function latestSubscription(db: Db, userId: string) {
  return db('subscriptions').where({ user_id: userId }).orderBy('created_at', 'desc').first();
}
