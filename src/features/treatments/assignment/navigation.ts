export type AssignmentActionNavigate = (route: string) => void;

const ADMIN_DASHBOARD_ROUTE = /^\/dashboard(?:[/?#]|$)/;

/**
 * Navigate corrective assignment actions inside the current authenticated tab.
 *
 * Admin authentication is intentionally tab-scoped, so opening these internal
 * routes in a new noopener tab would start without the current session.
 */
export function navigateToAssignmentAction(
  navigate: AssignmentActionNavigate,
  actionRoute: string
): boolean {
  const route = actionRoute.trim();
  if (!ADMIN_DASHBOARD_ROUTE.test(route)) return false;

  navigate(route);
  return true;
}
