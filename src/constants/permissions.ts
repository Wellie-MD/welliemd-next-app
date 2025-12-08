/**
 * Permission constants matching backend permissions
 * Must stay in sync with apps/core/constants.py
 */

export const Permissions = {
    // Portal User Management
    PORTAL_USER_LIST: 'portal_user:list',
    PORTAL_USER_INVITE: 'portal_user:invite',
    PORTAL_USER_UPDATE: 'portal_user:update',
    PORTAL_USER_DELETE: 'portal_user:delete',
    PORTAL_USER_ASSIGN_ROLE: 'portal_user:assign_role',

    // Billing (Primary Owner only)
    BILLING_VIEW: 'billing:view',
    BILLING_UPDATE: 'billing:update',

    // Orders
    ORDER_LIST: 'order:list',
    ORDER_VIEW: 'order:view',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',

    // Messages
    MESSAGE_LIST: 'message:list',
    MESSAGE_VIEW: 'message:view',
    MESSAGE_SEND: 'message:send',

    // Coupons
    COUPON_LIST: 'coupon:list',
    COUPON_CREATE: 'coupon:create',
    COUPON_UPDATE: 'coupon:update',
    COUPON_DELETE: 'coupon:delete',

    // Products
    PRODUCT_MANAGE: 'manage_products',
    PRODUCT_ASSIGN: 'assign_products',
    PRODUCT_ARCHIVE: 'archive_products',

    // Templates
    TEMPLATE_MANAGE: 'manage_templates',
    TEMPLATE_ASSIGN: 'assign_templates',
    TEMPLATE_ARCHIVE: 'archive_templates',
} as const;

export const RoleNames = {
    PRIMARY_OWNER: 'Primary Owner',
    ADMIN: 'Admin',
    CUSTOMER_SERVICE: 'Customer Service',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
export type RoleName = typeof RoleNames[keyof typeof RoleNames];
