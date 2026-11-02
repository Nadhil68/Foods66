declare const router: import("express-serve-static-core").Router;
/**
 * Helper to compute date boundaries with consistent timezone handling
 */
export declare const getDateFilterRange: (rangeType?: string, customStart?: string, customEnd?: string) => {
    start: Date;
    end: Date;
};
export default router;
//# sourceMappingURL=analytics.d.ts.map