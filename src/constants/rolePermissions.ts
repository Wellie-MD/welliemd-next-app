import { Permissions, RoleNames } from './permissions';

/**
 * Role-Permission mapping matching backend CLIENT_PORTAL_ROLES
 * Must stay in sync with apps/core/constants.py
 */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
    [RoleNames.SUPER_ADMIN]: Object.values(Permissions),

    [RoleNames.PRIMARY_OWNER]: [
        // User Management
        Permissions.PORTAL_USER_LIST,
        Permissions.PORTAL_USER_INVITE,
        Permissions.PORTAL_USER_UPDATE,
        Permissions.PORTAL_USER_DELETE,
        Permissions.PORTAL_USER_ASSIGN_ROLE,

        // Billing (exclusive to Primary Owner)
        Permissions.BILLING_VIEW,
        Permissions.BILLING_UPDATE,

        // Client domain management
        Permissions.CLIENT_DOMAIN_VIEW,
        Permissions.CLIENT_DOMAIN_MANAGE,

        // Orders
        Permissions.ORDER_LIST,
        Permissions.ORDER_VIEW,
        Permissions.ORDER_UPDATE,
        Permissions.ORDER_DELETE,

        // Patients
        Permissions.USER_UPDATE,
        Permissions.USER_DELETE,

        // Products
        Permissions.PRODUCT_MANAGE,
        Permissions.PRODUCT_ASSIGN,
        Permissions.PRODUCT_ARCHIVE,

        // Messages
        Permissions.MESSAGE_LIST,
        Permissions.MESSAGE_VIEW,
        Permissions.MESSAGE_SEND,

        // Coupons
        Permissions.COUPON_LIST,
        Permissions.COUPON_CREATE,
        Permissions.COUPON_UPDATE,
        Permissions.COUPON_DELETE,

        // Refunds
        Permissions.REFUND_CREATE,

        // Templates
        Permissions.TEMPLATE_MANAGE,
        Permissions.TEMPLATE_ASSIGN,
        Permissions.TEMPLATE_ARCHIVE,
    ],

    [RoleNames.ADMIN]: [
        // All permissions EXCEPT billing
        Permissions.PORTAL_USER_LIST,
        Permissions.PORTAL_USER_INVITE,
        Permissions.PORTAL_USER_UPDATE,
        Permissions.PORTAL_USER_DELETE,
        Permissions.PORTAL_USER_ASSIGN_ROLE,

        // Client domain management
        Permissions.CLIENT_DOMAIN_VIEW,
        Permissions.CLIENT_DOMAIN_MANAGE,
        Permissions.ORDER_LIST,
        Permissions.ORDER_VIEW,
        Permissions.ORDER_UPDATE,
        Permissions.ORDER_DELETE,

        // Patients
        Permissions.USER_UPDATE,
        Permissions.USER_DELETE,
        Permissions.PRODUCT_MANAGE,
        Permissions.PRODUCT_ASSIGN,
        Permissions.PRODUCT_ARCHIVE,
        Permissions.MESSAGE_LIST,
        Permissions.MESSAGE_VIEW,
        Permissions.MESSAGE_SEND,
        Permissions.COUPON_LIST,
        Permissions.COUPON_CREATE,
        Permissions.COUPON_UPDATE,
        Permissions.COUPON_DELETE,
        // Refunds
        Permissions.REFUND_CREATE,
        Permissions.TEMPLATE_MANAGE,
        Permissions.TEMPLATE_ASSIGN,
        Permissions.TEMPLATE_ARCHIVE,
    ],

    [RoleNames.CUSTOMER_SERVICE]: [
        // Limited permissions
        // Portal / Patients
        Permissions.PORTAL_USER_LIST,
        Permissions.USER_LIST,
        Permissions.USER_RETRIEVE,
        Permissions.USER_UPDATE,
        Permissions.USER_DELETE,

        Permissions.ORDER_LIST,
        Permissions.ORDER_VIEW,
        Permissions.PRODUCT_MANAGE,
        Permissions.MESSAGE_LIST,
        Permissions.MESSAGE_VIEW,
        Permissions.MESSAGE_SEND,
        Permissions.COUPON_CREATE,
        // Questionnaires
        Permissions.TEMPLATE_MANAGE,
        Permissions.TEMPLATE_ASSIGN,
        Permissions.TEMPLATE_ARCHIVE,
    ],
};
