export function checkPermission(session, moduleKey, action = "view") {
    if (!session?.user) return false;
    const role = session.user.role;

    // ADMIN always has full permissions across all modules
    if (role === "ADMIN") return true;

    // User Management, Branch Management, and Settings are strictly restricted to ADMIN
    if (moduleKey === "users" || moduleKey === "branches" || moduleKey === "settings") {
        return false;
    }

    let permissions = session.user.permissions;
    if (typeof permissions === "string") {
        try {
            permissions = JSON.parse(permissions);
        } catch {
            permissions = null;
        }
    }

    if (permissions && typeof permissions === "object" && permissions !== null && permissions[moduleKey]) {
        const mod = permissions[moduleKey];
        if (mod && mod[action] !== undefined) {
            return Boolean(mod[action]);
        }
    }

    // Fallback logic when permissions are not explicitly defined
    if (role === "MANAGER") {
        return moduleKey !== "users" && moduleKey !== "branches" && moduleKey !== "settings";
    }
    if (role === "STAFF") {
        if (action === "view") {
            return [
                "dashboard", 
                "bookings", 
                "customers", 
                "measurements", 
                "products",
                "receiving-transactions", 
                "sale-list", 
                "sale-returns"
            ].includes(moduleKey);
        }
        return false;
    }

    return false;
}
