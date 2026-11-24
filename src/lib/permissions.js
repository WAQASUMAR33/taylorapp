export function isUserAdmin(session) {
    if (!session) return false;
    const user = session?.user || session;
    const role = String(user?.role || "").trim().toUpperCase();
    return role === "ADMIN" || Boolean(user?.isAdmin);
}

export function isUserCashier(session) {
    if (!session) return false;
    const user = session?.user || session;
    const role = String(user?.role || "").trim().toUpperCase();
    return role === "CASHIER" || Boolean(checkPermission(session, "bookings", "receive_cash"));
}

export function checkPermission(session, moduleKey, action = "view") {
    if (!session) return false;
    const user = session?.user || session;
    if (!user) return false;

    // ADMIN always has full permissions across all modules and all tasks without any extra permission
    if (isUserAdmin(session)) {
        return true;
    }

    const role = String(user.role || "").trim().toUpperCase();

    // User Management, Branch Management, and Settings are strictly restricted to ADMIN
    if (moduleKey === "users" || moduleKey === "branches" || moduleKey === "settings") {
        return false;
    }

    let permissions = user.permissions;
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

    if (role === "CASHIER") {
        if (action === "view") {
            return [
                "dashboard",
                "bookings",
                "customers",
                "receiving-transactions",
                "ledger",
                "sale-list"
            ].includes(moduleKey);
        }
        if (action === "receive_cash") {
            return ["bookings", "receiving-transactions"].includes(moduleKey);
        }
        if (action === "create" && moduleKey === "ledger") {
            return true;
        }
        return false;
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
        if (action === "create" && ["bookings", "customers", "measurements"].includes(moduleKey)) {
            return true;
        }
        return false;
    }

    return false;
}
