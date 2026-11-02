import { Request, Response } from 'express';
declare const router: import("express-serve-static-core").Router;
/**
 * Handle Stripe Webhooks with Idempotency & Lifecycle automation
 */
export declare const handleStripeWebhook: (req: Request, res: Response) => Promise<void>;
export default router;
//# sourceMappingURL=webhooks.d.ts.map