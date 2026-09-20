/**
 * Hub is the only primary nav item. Nested class workspaces stay Hub-active
 * so the rail never looks unselected.
 */
export function isHubNavActive(pathname: string): boolean {
  if (pathname === "/ai-hub" || pathname.startsWith("/ai-hub/")) {
    return true;
  }
  if (pathname === "/classes" || pathname.startsWith("/classes/")) {
    return true;
  }
  return false;
}
