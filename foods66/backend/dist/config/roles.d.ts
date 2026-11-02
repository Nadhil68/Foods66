/**
 * Centralized Role Definitions for Foods66 RBAC
 *
 * All role checks across the application MUST reference these constants.
 * Never use raw string literals for role comparisons.
 */
export declare const ROLES: {
    readonly CUSTOMER: "customer";
    readonly RESTAURANT: "restaurant";
    readonly DRIVER: "driver";
    readonly ADMIN: "admin";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
/** All valid roles as an array — useful for validation */
export declare const ALL_ROLES: Role[];
//# sourceMappingURL=roles.d.ts.map