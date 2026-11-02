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
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** All valid roles as an array — useful for validation */
export const ALL_ROLES: Role[] = Object.values(ROLES);
