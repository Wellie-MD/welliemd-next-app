export const TREATMENT_ORDER_ACTION_PATH = Object.freeze({
    withdraw: (caseId: string) => `/patient/treatment-cases/${caseId}/withdraw/`,
    reauthorize: (caseId: string) => `/patient/treatment-cases/${caseId}/reauthorize/`,
});

export const TREATMENT_ORDER_LIFECYCLE = Object.freeze({
    awaitingLabs: 'awaiting_labs',
    reauthorizationRequired: 'reauthorization_required',
    withdrawn: 'withdrawn',
});

export const TREATMENT_ORDER_PORTAL_PATH = Object.freeze({
    labs: '/dashboard/labs',
    billing: '/dashboard/billing',
    messages: '/dashboard/messages',
    order: (orderId: string) => `/dashboard/orders/${orderId}`,
});
