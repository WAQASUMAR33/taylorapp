"use client";

import Link from "next/link";
import {
    Users,
    Scissors,
    TrendingUp,
    Clock,
    Plus,
    Package,
    DollarSign,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ShoppingBag,
} from "lucide-react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Button,
    Avatar,
    Stack,
    Divider,
    Chip,
    List,
    ListItemAvatar,
    ListItemText,
    ListItemButton,
} from "@mui/material";

/* ─── helpers ─────────────────────────────────────────────── */

/** Returns the right MUI Chip color for each booking status */
function statusColor(status) {
    switch (status) {
        case "DELIVERED": return "success";
        case "READY": return "primary";
        case "TRIAL": return "info";
        case "STITCHING": return "secondary";
        case "CUTTING": return "warning";
        case "MEASUREMENT_TAKEN": return "default";
        case "CANCELLED": return "error";
        default: return "default";
    }
}

/** Human-readable label for a status string */
function statusLabel(status) {
    return status?.replace(/_/g, " ") ?? "";
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, iconBgColor, iconColor, href, subtitle }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: 150,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
                transition: "all 0.3s ease",
                '&:hover': {
                    borderColor: 'primary.main',
                    '& .arrow-box': {
                        backgroundColor: (t) => t.palette.primary.main,
                        color: "#fff",
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                }
            }}
        >
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: iconBgColor,
                                color: iconColor,
                            }}
                        >
                            <Icon size={18} />
                        </Avatar>
                        <Box
                            className="arrow-box"
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'transparent'
                            }}
                        >
                            <ChevronRight size={16} />
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5, letterSpacing: '0.02em' }}>
                        {title}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                        {subtitle}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

/* ─── Quick-action item ───────────────────────────────────── */
function ActionItem({ title, icon: Icon, iconBgColor, iconColor, href }) {
    return (
        <Box
            component={Link}
            href={href}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.2,
                textDecoration: "none",
                transition: "all 0.2s ease",
                '&:hover': {
                    transform: "translateY(-4px)",
                    '& .MuiAvatar-root': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                    }
                }
            }}
        >
            <Avatar
                variant="rounded"
                sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    bgcolor: iconBgColor,
                    color: iconColor,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
            >
                <Icon size={24} />
            </Avatar>
            <Typography
                variant="caption"
                fontWeight={700}
                color="text.primary"
                sx={{
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: 80
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}

/* ─── Today overview row ──────────────────────────────────── */
function OverviewRow({ icon: Icon, iconBgColor, iconColor, label, value }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
            }}
        >
            <Avatar
                variant="rounded"
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: iconBgColor,
                    color: iconColor,
                    flexShrink: 0,
                }}
            >
                <Icon size={20} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

/* ─── Main component ──────────────────────────────────────── */
export default function DashboardClient({ statsData, recentOrders, session }) {

    const stats = [
        {
            title: "Total Customers",
            value: statsData.totalCustomers.toLocaleString(),
            icon: Users,
            iconBgColor: (t) => t.palette.primary.main,
            iconColor: "#fff",
            href: "/dashboard/customers",
            subtitle: "Registered accounts",
        },
        {
            title: "Active Orders",
            value: statsData.activeOrders.toLocaleString(),
            icon: Scissors,
            iconBgColor: (t) => t.palette.secondary.main,
            iconColor: "#fff",
            href: "/dashboard/bookings",
            subtitle: "In progress",
        },
        {
            title: "Revenue (MTD)",
            value: `Rs. ${Number(statsData.revenue).toLocaleString()}`,
            icon: TrendingUp,
            iconBgColor: (t) => t.palette.success.main,
            iconColor: "#fff",
            href: "/dashboard/bookings",
            subtitle: "Month to date",
        },
        {
            title: "Ready for Delivery",
            value: statsData.pendingDelivery.toLocaleString(),
            icon: Clock,
            iconBgColor: (t) => t.palette.warning.main,
            iconColor: "#fff",
            href: "/dashboard/bookings?status=READY",
            subtitle: "Awaiting pickup",
        },
    ];

    const quickActions = [
        {
            title: "New Order",
            icon: Plus,
            iconBgColor: (t) => t.palette.primary.main,
            iconColor: "#fff",
            href: "/dashboard/bookings",
        },
        {
            title: "Add Customer",
            icon: Users,
            iconBgColor: (t) => t.palette.success.main,
            iconColor: "#fff",
            href: "/dashboard/customers",
        },
        {
            title: "Add Product",
            icon: Package,
            iconBgColor: (t) => t.palette.info.main,
            iconColor: "#fff",
            href: "/dashboard/products",
        },
        {
            title: "Purchases",
            icon: ShoppingBag,
            iconBgColor: (t) => t.palette.warning.main,
            iconColor: "#fff",
            href: "/dashboard/purchases",
        },
    ];

    return (
        <Box sx={{ width: '100%', py: 3, px: { xs: 2, sm: 3 } }}>

            {/* ── Welcome ─────────────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                    gap: 2,
                    mb: 4,
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        Welcome back, {session?.user?.name || "User"} 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Here&apos;s what&apos;s happening at your shop today.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    component={Link}
                    href="/dashboard/bookings"
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        alignSelf: { xs: "flex-start", sm: "auto" },
                    }}
                >
                    New Order
                </Button>
            </Box>

            {/* ── Stat cards ──────────────────────────────────── */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4 }}>
                {stats.map((s) => (
                    <Box key={s.title} sx={{ width: 200, flex: '0 0 auto' }}>
                        <StatCard {...s} />
                    </Box>
                ))}
            </Box>

            {/* ── Quick Actions ────────────────────────────────── */}
            <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 5, mb: 4, px: 1 }}>
                {quickActions.map((a) => (
                    <ActionItem key={a.title} {...a} />
                ))}
            </Box>

            {/* ── Bottom row ───────────────────────────────────── */}
            <Grid container spacing={3}>

                {/* Recent Orders */}
                <Grid item xs={12} lg={9}>
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            minWidth: 700,
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>
                                Recent Orders
                            </Typography>
                            <Button
                                component={Link}
                                href="/dashboard/bookings"
                                size="small"
                                endIcon={<ChevronRight size={16} />}
                                sx={{ textTransform: "none", borderRadius: 2 }}
                            >
                                View all
                            </Button>
                        </Box>

                        {/* List */}
                        {recentOrders.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: "center" }}>
                                <Scissors size={36} color="#d1d5db" />
                                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                    No recent orders yet.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {recentOrders.map((order, idx) => (
                                    <Box key={order.id}>
                                        <ListItemButton
                                            component={Link}
                                            href={`/dashboard/bookings`}
                                            sx={{ px: 3, py: 1.5 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={(t) => ({
                                                        bgcolor: t.palette.secondary.light,
                                                        color: t.palette.secondary.main,
                                                        fontWeight: 700,
                                                        fontSize: "0.85rem",
                                                    })}
                                                >
                                                    {order.avatar}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                                        {order.customer}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {order.bookingNumber} &bull; {order.items} item{order.items !== 1 ? "s" : ""}
                                                        {order.daysRemaining !== 0 && (
                                                            <> &bull; {order.daysRemaining > 0 ? `${order.daysRemaining}d left` : `${Math.abs(order.daysRemaining)}d overdue`}</>
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                            <Chip
                                                label={statusLabel(order.status)}
                                                size="small"
                                                color={statusColor(order.status)}
                                                sx={{ fontWeight: 600, fontSize: "0.7rem", borderRadius: 1, ml: 1 }}
                                            />
                                        </ListItemButton>
                                        {idx < recentOrders.length - 1 && <Divider component="li" />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Card>
                </Grid>

                {/* Today's Overview */}
                <Grid item xs={12} lg={3}>
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>
                                Today&apos;s Overview
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
                            </Typography>
                        </Box>

                        <CardContent sx={{ px: 3, py: 2 }}>
                            <Stack
                                divider={<Divider flexItem />}
                                spacing={0}
                            >
                                <OverviewRow
                                    icon={CheckCircle2}
                                    iconBgColor={(t) => t.palette.success.main}
                                    iconColor="#fff"
                                    label="Completed Orders"
                                    value={statsData.completedToday}
                                />
                                <OverviewRow
                                    icon={Calendar}
                                    iconBgColor={(t) => t.palette.info.main}
                                    iconColor="#fff"
                                    label="Scheduled Trials"
                                    value={statsData.trialsToday}
                                />
                                <OverviewRow
                                    icon={DollarSign}
                                    iconBgColor={(t) => t.palette.warning.main}
                                    iconColor="#fff"
                                    label="Revenue Today"
                                    value={`Rs. ${Number(statsData.revenueToday).toLocaleString()}`}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

        </Box>
    );
}
