/**
 * Centralized Role Definitions for Foods66 RBAC
 *
 * All role checks across the application MUST reference these constants.
 * Never use raw string literals for role comparisons.
 */
export const ROLES = {
    CUSTOMER: 'customer',
    RESTAURANT: 'restaurant',
    DRIVER: 'driver',
    ADMIN: 'admin',
};
/** All valid roles as an array — useful for validation */
export const ALL_ROLES = Object.values(ROLES);
//# sourceMappingURL=roles.js.map