"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserRound,
    ShoppingCart,
    Scissors,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Package,
    Ruler,
    Calendar as CalendarIcon,
    BookText,
    Boxes,
    Tags,
    BarChart3,
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
    Tooltip
} from "@mui/material";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Account Management", href: "/dashboard/customers", icon: Users, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Measurements", href: "/dashboard/measurements", icon: Ruler, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Bookings", href: "/dashboard/bookings", icon: CalendarIcon, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
    { name: "Employees", href: "/dashboard/employees", icon: UserRound, roles: ["ADMIN", "MANAGER"] },
    { name: "Products", href: "/dashboard/products", icon: Package, roles: ["ADMIN", "MANAGER"] },
    { name: "Material Stock", href: "/dashboard/materials", icon: Boxes, roles: ["ADMIN", "MANAGER"] },
    { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingCart, roles: ["ADMIN", "MANAGER"] },
    { name: "Ledger", href: "/dashboard/ledger", icon: BookText, roles: ["ADMIN", "MANAGER"] },
    { name: "Account Categories", href: "/dashboard/account-categories", icon: Tags, roles: ["ADMIN", "MANAGER"] },
    { name: "Stitching Orders", href: "/dashboard/stitching-orders", icon: Scissors, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "User Management", href: "/dashboard/users", icon: Settings, roles: ["ADMIN"] },
];

export default function Sidebar({ collapsed, setCollapsed, drawerWidth, collapsedDrawerWidth }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const theme = useTheme();

    const sidebarWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

    const filteredNavItems = navItems.filter((item) =>
        item.roles.includes(session?.user?.role)
    );

    return (
        <Box
            component="nav"
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: `${sidebarWidth}px`,
                transition: 'width 0.2s ease',
                bgcolor: 'background.paper',
                borderRight: `1px solid ${theme.palette.divider}`,
                boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 200,
            }}
        >
            {/* Brand */}
            <Box sx={{
                px: 2,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                minHeight: 64,
                flexShrink: 0,
            }}>
                <Box sx={{
                    height: 38,
                    width: 38,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(79,70,229,0.4)',
                    flexShrink: 0,
                }}>
                    <Scissors size={20} color="white" />
                </Box>
                {!collapsed && (
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        noWrap
                        sx={{
                            background: 'linear-gradient(to right, #2563EB, #4F46E5)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        TailorFlow
                    </Typography>
                )}
            </Box>

            <Divider />

            {/* Nav links */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
                <List disablePadding sx={{ px: 1 }}>
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
                                <Tooltip title={collapsed ? item.name : ""} placement="right" arrow>
                                    <ListItemButton
                                        component={Link}
                                        href={item.href}
                                        sx={{
                                            minHeight: 44,
                                            borderRadius: 2,
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            px: collapsed ? 1.5 : 2,
                                            background: isActive
                                                ? 'linear-gradient(135deg, #2563EB, #4F46E5)'
                                                : 'transparent',
                                            color: isActive ? 'white' : 'text.secondary',
                                            boxShadow: isActive ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                                            '&:hover': {
                                                bgcolor: isActive ? undefined : 'action.hover',
                                                color: isActive ? 'white' : 'text.primary',
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: 0,
                                            mr: collapsed ? 0 : 2,
                                            color: 'inherit',
                                            justifyContent: 'center',
                                        }}>
                                            <item.icon size={19} />
                                        </ListItemIcon>
                                        {!collapsed && (
                                            <ListItemText
                                                primary={item.name}
                                                primaryTypographyProps={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: isActive ? 600 : 400,
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
            </Box>

            <Divider />

            {/* Bottom actions */}
            <Box sx={{ px: 1, py: 1, flexShrink: 0 }}>
                {/* Collapse toggle */}
                <Tooltip title={collapsed ? "Expand" : ""} placement="right" arrow>
                    <ListItemButton
                        onClick={() => setCollapsed(!collapsed)}
                        sx={{
                            minHeight: 44,
                            borderRadius: 2,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            px: collapsed ? 1.5 : 2,
                            mb: 0.5,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: 'inherit', justifyContent: 'center' }}>
                            {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary="Collapse" primaryTypographyProps={{ fontSize: '0.875rem' }} />}
                    </ListItemButton>
                </Tooltip>

                {/* Logout */}
                <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
                    <ListItemButton
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        sx={{
                            minHeight: 44,
                            borderRadius: 2,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            px: collapsed ? 1.5 : 2,
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.50', backgroundColor: 'rgba(239,68,68,0.08)' },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: 'inherit', justifyContent: 'center' }}>
                            <LogOut size={19} />
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />}
                    </ListItemButton>
                </Tooltip>

                {!collapsed && (
                    <Typography variant="caption" color="text.disabled" align="center" display="block" sx={{ pt: 1, pb: 0.5 }}>
                        v1.0.0
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
