import { Request, Response } from 'express';
declare const router: import("express-serve-static-core").Router;
/**
 * @desc    Analyze & Validate Health Profile
 * @route   POST /api/health-validation/analyze
 * @access  Public (Used during registration)
 */
export declare function handleHealthValidation(req: Request, res: Response): Promise<void>;
export default router;
//# sourceMappingURL=healthValidation.d.ts.map