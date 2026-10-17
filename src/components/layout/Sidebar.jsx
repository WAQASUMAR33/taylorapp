"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Scissors,
    Settings,
    SlidersHorizontal,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Package,
    Ruler,
    Calendar as CalendarIcon,
    BookText,
    Boxes,
    Tags,
    BarChart3,
    ClipboardList,
    TrendingDown,
    Receipt,
    RotateCcw,
    ReceiptText,
    Store,
    Search,
    X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    useTheme,
    Tooltip,
    Chip,
    Collapse,
    TextField,
    InputAdornment,
    IconButton,
} from "@mui/material";

import { checkPermission } from "@/lib/permissions";

const navSections = [
    {
        id: "overview",
        title: "OVERVIEW",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard", roles: ["ADMIN", "MANAGER", "STAFF"] },
            { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, moduleKey: "analytics", roles: ["ADMIN", "MANAGER"] },
        ],
    },
    {
        id: "operations",
        title: "OPERATIONS & TAILORING",
        items: [
            { name: "Account Management", href: "/dashboard/customers", icon: Users, moduleKey: "customers", roles: ["ADMIN", "MANAGER", "STAFF"] },
            { name: "Measurements", href: "/dashboard/measurements", icon: Ruler, moduleKey: "measurements", roles: ["ADMIN", "MANAGER", "STAFF"] },
            { name: "Bookings", href: "/dashboard/bookings", icon: CalendarIcon, moduleKey: "bookings", roles: ["ADMIN", "MANAGER", "STAFF"] },
            { name: "Sale History", href: "/dashboard/sale-list", icon: ClipboardList, moduleKey: "sale-list", roles: ["ADMIN", "MANAGER", "STAFF"] },
            { name: "Sale Returns", href: "/dashboard/sale-returns", icon: RotateCcw, moduleKey: "sale-returns", roles: ["ADMIN", "MANAGER", "STAFF"] },
        ],
    },
    {
        id: "inventory",
        title: "INVENTORY & PURCHASES",
        items: [
            { name: "Products", href: "/dashboard/products", icon: Package, moduleKey: "products", roles: ["ADMIN", "MANAGER"] },
            { name: "Material Stock", href: "/dashboard/materials", icon: Boxes, moduleKey: "materials", roles: ["ADMIN", "MANAGER"] },
            { name: "Stock Out Records", href: "/dashboard/material-out-records", icon: TrendingDown, moduleKey: "material-out-records", roles: ["ADMIN", "MANAGER"] },
            { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingCart, moduleKey: "purchases", roles: ["ADMIN", "MANAGER"] },
        ],
    },
    {
        id: "accounts",
        title: "ACCOUNTS & EXPENSES",
        items: [
            { name: "Expenses", href: "/dashboard/expenses", icon: Receipt, moduleKey: "expenses", roles: ["ADMIN", "MANAGER"] },
            { name: "Stitching Expenses", href: "/dashboard/stitching-expenses", icon: Receipt, moduleKey: "stitching-expenses", roles: ["ADMIN", "MANAGER"] },
            { name: "Stitching Titles", href: "/dashboard/stitching-expense-titles", icon: Tags, moduleKey: "stitching-expense-titles", roles: ["ADMIN", "MANAGER"] },
            { name: "Ledger", href: "/dashboard/ledger", icon: BookText, moduleKey: "ledger", roles: ["ADMIN", "MANAGER"] },
            { name: "Transaction Roster", href: "/dashboard/receiving-transactions", icon: ReceiptText, moduleKey: "receiving-transactions", roles: ["ADMIN", "MANAGER", "STAFF"] },
        ],
    },
    {
        id: "administration",
        title: "ADMINISTRATION",
        items: [
            { name: "Account Categories", href: "/dashboard/account-categories", icon: Tags, moduleKey: "categories", roles: ["ADMIN", "MANAGER"] },
            { name: "Stitching Options", href: "/dashboard/stitching-options", icon: SlidersHorizontal, moduleKey: "stitching-options", roles: ["ADMIN", "MANAGER"] },
            { name: "Branch Management", href: "/dashboard/branches", icon: Store, moduleKey: "branches", roles: ["ADMIN"] },
            { name: "User Management", href: "/dashboard/users", icon: Settings, moduleKey: "users", roles: ["ADMIN"] },
            { name: "Settings", href: "/dashboard/settings", icon: SlidersHorizontal, moduleKey: "settings", roles: ["ADMIN"] },
        ],
    },
];

export default function Sidebar({ collapsed, setCollapsed, drawerWidth, collapsedDrawerWidth }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const theme = useTheme();

    // Interactive state: open/closed sections
    const [openSections, setOpenSections] = useState({
        overview: true,
        operations: true,
        inventory: true,
        accounts: true,
        administration: true,
    });

    // Interactive state: nav search query
    const [navSearch, setNavSearch] = useState("");

    const toggleSection = (id) => {
        setOpenSections((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const sidebarWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

    const isItemAllowed = (item) => {
        if (!session?.user) return false;
        const role = session.user.role;
        if (role === "ADMIN") return true;

        if (item.moduleKey === "users" || item.moduleKey === "branches" || item.moduleKey === "settings") {
            return false;
        }

        let perms = session.user.permissions;
        if (typeof perms === "string") {
            try {
                perms = JSON.parse(perms);
            } catch {
                perms = null;
            }
        }
        if (item.moduleKey && perms && typeof perms === "object") {
            const modPerm = perms[item.moduleKey];
            if (modPerm !== undefined) {
                return Boolean(modPerm.view || modPerm.create || modPerm.edit || modPerm.delete);
            }
        }

        if (checkPermission(session, item.moduleKey, "view")) {
            return true;
        }

        if (!role || role === "USER" || role === "STAFF") {
            return [
                "dashboard",
                "customers",
                "measurements",
                "bookings",
                "sale-list",
                "sale-returns",
                "receiving-transactions",
            ].includes(item.moduleKey);
        }

        return false;
    };

    // Filter nav items by search query if user typed
    const filteredSections = useMemo(() => {
        return navSections.map((sec) => {
            const visibleItems = sec.items.filter((item) => {
                const allowed = isItemAllowed(item);
                if (!allowed) return false;
                if (!navSearch.trim()) return true;
                return item.name.toLowerCase().includes(navSearch.trim().toLowerCase());
            });
            return {
                ...sec,
                items: visibleItems,
            };
        });
    }, [navSearch, session]);

    return (
        <Box
            component="nav"
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                width: `${sidebarWidth}px`,
                transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                bgcolor: "#FFFFFF",
                borderRight: `1px solid ${theme.palette.divider}`,
                boxShadow: "1px 0 6px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 200,
                borderRadius: 0,
            }}
        >
            {/* Brand Header */}
            <Box
                sx={{
                    px: collapsed ? 1.5 : 2.5,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    justifyContent: collapsed ? "center" : "flex-start",
                    minHeight: 64,
                    flexShrink: 0,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                }}
            >
                <Box
                    sx={{
                        height: 38,
                        width: 38,
                        borderRadius: 0,
                        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                        flexShrink: 0,
                    }}
                >
                    <Scissors size={20} />
                </Box>
                {!collapsed && (
                    <Box sx={{ overflow: "hidden" }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            noWrap
                            sx={{
                                background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                            }}
                        >
                            GRACE TAILORS
                        </Typography>
                        <Chip
                            label="ENTERPRISE"
                            size="small"
                            sx={{
                                mt: 0.2,
                                height: 16,
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                bgcolor: "rgba(37, 99, 235, 0.08)",
                                color: "primary.main",
                                borderRadius: 0,
                                px: 0.2,
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Quick Interactive Search Bar (When Expanded) */}
            {!collapsed && (
                <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Filter navigation..."
                        value={navSearch}
                        onChange={(e) => setNavSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={14} color="#94A3B8" />
                                </InputAdornment>
                            ),
                            endAdornment: navSearch && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setNavSearch("")}>
                                        <X size={13} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                height: 32,
                                fontSize: "0.775rem",
                                bgcolor: "#F8FAFC",
                                borderRadius: 0,
                                "& fieldset": { borderColor: "rgba(226, 232, 240, 0.9)", borderRadius: 0 },
                                "&:hover fieldset": { borderColor: "#CBD5E1" },
                                "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: "1px", borderRadius: 0 },
                            },
                        }}
                    />
                </Box>
            )}

            {/* Categorized Interactive Nav List */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    py: 1,
                    px: 1,
                }}
            >
                {filteredSections.map((section, idx) => {
                    if (section.items.length === 0) return null;
                    const isOpen = openSections[section.id] !== false || navSearch.trim().length > 0;

                    return (
                        <Box key={section.id} sx={{ mb: 1.5 }}>
                            {!collapsed ? (
                                <Box
                                    onClick={() => toggleSection(section.id)}
                                    sx={{
                                        px: 1.25,
                                        py: 0.6,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                        userSelect: "none",
                                        "&:hover": {
                                            bgcolor: "rgba(0,0,0,0.02)",
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: "0.6875rem",
                                            letterSpacing: "0.08em",
                                            color: "#94A3B8",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {section.title}
                                    </Typography>
                                    <ChevronDown
                                        size={14}
                                        color="#94A3B8"
                                        style={{
                                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    />
                                </Box>
                            ) : (
                                idx > 0 && <Divider sx={{ my: 1, mx: 1 }} />
                            )}

                            <Collapse in={collapsed ? true : isOpen} timeout="auto" unmountOnExit={false}>
                                <List disablePadding>
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                                        return (
                                            <ListItem key={item.name} disablePadding sx={{ mb: 0.25 }}>
                                                <Tooltip title={collapsed ? item.name : ""} placement="right" arrow>
                                                    <ListItemButton
                                                        component={Link}
                                                        href={item.href}
                                                        sx={{
                                                            minHeight: 38,
                                                            borderRadius: 0,
                                                            justifyContent: collapsed ? "center" : "flex-start",
                                                            px: collapsed ? 1 : 1.5,
                                                            py: 0.75,
                                                            background: isActive
                                                                ? "linear-gradient(90deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.04) 100%)"
                                                                : "transparent",
                                                            color: isActive ? "#1D4ED8" : "#475569",
                                                            borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                                                            transition: "all 0.15s ease",
                                                            "&:hover": {
                                                                bgcolor: isActive ? "rgba(37, 99, 235, 0.14)" : "rgba(37, 99, 235, 0.05)",
                                                                color: isActive ? "#1D4ED8" : "#0F172A",
                                                                borderLeft: isActive ? "3px solid #2563EB" : "3px solid #94A3B8",
                                                            },
                                                        }}
                                                    >
                                                        <ListItemIcon
                                                            sx={{
                                                                minWidth: 0,
                                                                mr: collapsed ? 0 : 1.5,
                                                                color: isActive ? "#2563EB" : "inherit",
                                                                justifyContent: "center",
                                                                display: "flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
                                                        </ListItemIcon>
                                                        {!collapsed && (
                                                            <ListItemText
                                                                primary={item.name}
                                                                primaryTypographyProps={{
                                                                    fontSize: "0.825rem",
                                                                    fontWeight: isActive ? 700 : 500,
                                                                    noWrap: true,
                                                                }}
                                                            />
                                                        )}
                                                    </ListItemButton>
                                                </Tooltip>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>

            <Divider />

            {/* Bottom Actions & Footer */}
            <Box sx={{ p: 1, flexShrink: 0, bgcolor: "#F8FAFC", borderRadius: 0 }}>
                {/* Collapse / Expand Toggle */}
                <Tooltip title={collapsed ? "Expand sidebar" : ""} placement="right" arrow>
                    <ListItemButton
                        onClick={() => setCollapsed(!collapsed)}
                        sx={{
                            minHeight: 36,
                            borderRadius: 0,
                            justifyContent: collapsed ? "center" : "flex-start",
                            px: collapsed ? 1 : 1.25,
                            mb: 0.5,
                            color: "#64748B",
                            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)", color: "#0F172A" },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.25, color: "inherit", justifyContent: "center" }}>
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </ListItemIcon>
                        {!collapsed && (
                            <ListItemText
                                primary="Collapse Sidebar"
                                primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>

                {/* Logout Button */}
                <Tooltip title={collapsed ? "Sign Out" : ""} placement="right" arrow>
                    <ListItemButton
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        sx={{
                            minHeight: 36,
                            borderRadius: 0,
                            justifyContent: collapsed ? "center" : "flex-start",
                            px: collapsed ? 1 : 1.25,
                            color: "error.main",
                            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)" },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.25, color: "inherit", justifyContent: "center" }}>
                            <LogOut size={18} />
                        </ListItemIcon>
                        {!collapsed && (
                            <ListItemText
                                primary="Sign Out"
                                primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>

                {!collapsed && (
                    <Box sx={{ pt: 0.5, display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.6875rem", fontWeight: 500 }}>
                            Grace Tailors Suite • Sharp Modern
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
