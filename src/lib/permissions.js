/**
 * Helper function to check if the current logged-in user has permission
 * for a specific module and action (view, create, edit, delete).
 *
 * @param {Object} session - NextAuth session object
 * @param {string} moduleKey - e.g. "bookings", "customers", "products", "purchases", "users", etc.
 * @param {string} action - "view" | "create" | "edit" | "delete"
 * @returns {boolean}
 */
export function checkPermission(session, moduleKey, action = "view") {
    if (!session?.user) return false;
    const role = session.user.role;

    // ADMIN always has full permissions across all modules
    if (role === "ADMIN") return true;

    const permissions = session.user.permissions;
    if (permissions && typeof permissions === "object" && permissions[moduleKey]) {
        const mod = permissions[moduleKey];
        if (mod[action] !== undefined) {
            return Boolean(mod[action]);
        }
    }

    // Fallback logic when permissions are not explicitly defined
    if (role === "MANAGER") {
        return moduleKey !== "users";
    }
    if (role === "STAFF") {
        if (action === "view") {
            return ["dashboard", "bookings", "customers", "measurements"].includes(moduleKey);
        }
        return false;
    }

    return false;
}
