import type { FastifyInstance } from 'fastify';
import { eventIdFrom, handleRazorpayEvent, verifyRazorpaySignature, type RazorpayEvent } from './billing.js';
import type { Ctx } from './ctx.js';

export function webhookRoutes(ctx: Ctx) {
  return async function (app: FastifyInstance) {
    // Signature is computed over the exact bytes Razorpay sent, so keep the body raw in this scope.
    app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));

    app.post('/webhooks/razorpay', async (req, reply) => {
      const secret = ctx.config.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) return reply.code(503).send({ error: 'payments_not_configured', message: "Payments aren't set up yet." });
      const raw = req.body as Buffer;
      if (!Buffer.isBuffer(raw)) return reply.code(415).send({ error: 'unsupported_media_type', message: 'Expected application/json.' });
      if (!verifyRazorpaySignature(secret, raw, req.headers['x-razorpay-signature'] as string | undefined)) {
        req.log.warn('razorpay webhook with bad signature');
        return reply.code(400).send({ error: 'invalid_signature', message: 'Signature check failed.' });
      }
      let evt: RazorpayEvent;
      try {
        evt = JSON.parse(raw.toString('utf8'));
      } catch {
        return reply.code(400).send({ error: 'invalid_json', message: 'Body is not JSON.' });
      }
      const eventId = eventIdFrom(req.headers['x-razorpay-event-id'] as string | undefined, raw);
      const result = await handleRazorpayEvent(ctx, req.log, eventId, evt);
      req.log.info({ eventId, type: evt.event, ...result }, 'razorpay webhook');
      return { ok: true, ...result };
    });
  };
}
