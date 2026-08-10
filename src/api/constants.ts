export const API_REQUEST_TIMEOUT_MS = 15_000;

// Password verification can be intentionally CPU intensive. Tenant containers
// with constrained local resources may need longer than the normal API timeout,
// so authentication requests get their own ceiling instead of failing as an
// apparent invalid-credentials error.
export const AUTH_REQUEST_TIMEOUT_MS = 60_000;
