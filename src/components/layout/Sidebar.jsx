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
                px: 3,
                py: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                minHeight: 80,
                flexShrink: 0,
            }}>
                <Box sx={{
                    height: 40,
                    width: 40,
                    borderRadius: '12px',
                    background: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(75, 59, 195, 0.3)',
                    flexShrink: 0,
                }}>
                    <Box sx={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>H</Box>
                </Box>
                {!collapsed && (
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        noWrap
                        sx={{
                            color: '#1E293B',
                            letterSpacing: '-0.02em',
                            fontSize: '1.25rem'
                        }}
                    >
                        Hireism
                    </Typography>
                )}
            </Box>

            {/* Nav links */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
                <List disablePadding sx={{ px: 2 }}>
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
                                <Tooltip title={collapsed ? item.name : ""} placement="right" arrow>
                                    <ListItemButton
                                        component={Link}
                                        href={item.href}
                                        sx={{
                                            minHeight: 48,
                                            borderRadius: '16px',
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            px: collapsed ? 1.5 : 2,
                                            backgroundColor: isActive ? 'primary.main' : 'transparent',
                                            color: isActive ? 'white' : '#64748B',
                                            boxShadow: isActive ? '0 8px 16px rgba(75, 59, 195, 0.25)' : 'none',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: isActive ? 'primary.main' : 'rgba(75, 59, 195, 0.05)',
                                                color: isActive ? 'white' : 'primary.main',
                                                '& .MuiListItemIcon-root': {
                                                    color: isActive ? 'white' : 'primary.main',
                                                }
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: 0,
                                            mr: collapsed ? 0 : 2,
                                            color: 'inherit',
                                            justifyContent: 'center',
                                            opacity: isActive ? 1 : 0.7,
                                        }}>
                                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </ListItemIcon>
                                        {!collapsed && (
                                            <ListItemText
                                                primary={item.name}
                                                primaryTypographyProps={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: isActive ? 700 : 500,
                                                    noWrap: true,
                                                }}
                                            />
                                        )}
                                        {isActive && !collapsed && (
                                            <Box sx={{ width: 4, height: 18, bgcolor: 'white', borderRadius: 2, ml: 1 }} />
                                        )}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Bottom actions */}
            <Box sx={{ px: 2, py: 2, flexShrink: 0 }}>
                {/* Logout */}
                <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
                    <ListItemButton
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        sx={{
                            minHeight: 48,
                            borderRadius: '16px',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            px: collapsed ? 1.5 : 2,
                            color: '#64748B',
                            '&:hover': {
                                bgcolor: 'rgba(239, 68, 68, 0.08)',
                                color: 'error.main',
                                '& .MuiListItemIcon-root': { color: 'error.main' }
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: 'inherit', justifyContent: 'center' }}>
                            <LogOut size={20} />
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />}
                    </ListItemButton>
                </Tooltip>

                {!collapsed && (
                    <Typography variant="caption" color="text.disabled" align="center" display="block" sx={{ pt: 2, pb: 0.5, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        V1.0.0
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
