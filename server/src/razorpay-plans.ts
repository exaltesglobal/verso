// One-off helper: creates the Pro monthly and yearly plans in Razorpay and prints the plan ids for .env.
// Usage: pnpm razorpay:plans 49900 499900   (amounts in paise; defaults shown)
import './env.js';
import { loadConfig } from './config.js';

const config = loadConfig();
if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
  console.error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET first.');
  process.exit(1);
}
const [monthly = '49900', yearly = '499900'] = process.argv.slice(2);
const auth = `Basic ${Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64')}`;

async function createPlan(period: 'monthly' | 'yearly', amount: number, name: string) {
  const res = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ period, interval: 1, item: { name, amount, currency: 'INR' } }),
  });
  const json = (await res.json()) as { id?: string; error?: { description?: string } };
  if (!res.ok || !json.id) throw new Error(json.error?.description ?? `HTTP ${res.status}`);
  return json.id;
}

const m = await createPlan('monthly', Number(monthly), 'Verso Pro (monthly)');
const y = await createPlan('yearly', Number(yearly), 'Verso Pro (yearly)');
console.log(`RAZORPAY_PLAN_PRO_MONTHLY=${m}\nRAZORPAY_PLAN_PRO_YEARLY=${y}`);
