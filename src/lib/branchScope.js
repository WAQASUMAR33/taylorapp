/**
 * Branch access scoping.
 * - ADMIN: can access every branch (optionally narrowed by a requested branch).
 * - Any other role: locked to the branch assigned to the user.
 */

export function isAdminSession(session) {
    return session?.user?.role === "ADMIN";
}

/**
 * Returns the branch id (number) the session is restricted to,
 * or null when the session has unrestricted access (ADMIN).
 * A non-admin without an assigned branch gets -1 (matches nothing).
 */
export function getScopedBranchId(session) {
    if (!session?.user) return -1;
    if (isAdminSession(session)) return null;
    const id = parseInt(session.user.branchId);
    return Number.isNaN(id) ? -1 : id;
}

/**
 * Resolves the branchId query value for list endpoints.
 * Admin: honours the requested value ("ALL"/empty = all branches).
 * Others: always their own branch, ignoring whatever was requested.
 * Returns a string compatible with `searchParams.get("branchId")` usage.
 */
export function scopeBranchParam(session, requested) {
    const scoped = getScopedBranchId(session);
    if (scoped === null) return requested;
    return String(scoped);
}

/**
 * Branch id to use when creating/updating records.
 * Non-admin users always write to their own branch.
 */
export function writeBranchId(session, requested) {
    const scoped = getScopedBranchId(session);
    if (scoped !== null) return scoped > 0 ? scoped : null;
    const parsed = parseInt(requested);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    const own = parseInt(session?.user?.branchId);
    return Number.isNaN(own) ? null : own;
}

/** Whether the session may access a record belonging to `branchId`. */
export function canAccessBranch(session, branchId) {
    const scoped = getScopedBranchId(session);
    if (scoped === null) return true;
    return Number(branchId) === scoped;
}

/** Filters a branches list down to what the session may see. */
export function filterBranches(session, branches) {
    const scoped = getScopedBranchId(session);
    if (scoped === null) return branches;
    return (branches || []).filter((b) => b.id === scoped);
}
