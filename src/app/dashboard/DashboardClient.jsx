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
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: iconBgColor,
                                color: iconColor,
                            }}
                        >
                            <Icon size={24} />
                        </Avatar>
                        <ChevronRight size={18} color="#9ca3af" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mt: 0.5, lineHeight: 1.2 }}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                            {subtitle}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

/* ─── Quick-action card ───────────────────────────────────── */
function ActionCard({ title, icon: Icon, iconBgColor, iconColor, href }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
                <CardContent
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2.5,
                    }}
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: iconBgColor,
                            color: iconColor,
                            flexShrink: 0,
                        }}
                    >
                        <Icon size={20} />
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {title}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
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
            iconBgColor: (t) => t.palette.primary.light,
            iconColor: (t) => t.palette.primary.main,
            href: "/dashboard/customers",
            subtitle: "Registered accounts",
        },
        {
            title: "Active Orders",
            value: statsData.activeOrders.toLocaleString(),
            icon: Scissors,
            iconBgColor: (t) => t.palette.secondary.light,
            iconColor: (t) => t.palette.secondary.main,
            href: "/dashboard/bookings",
            subtitle: "In progress",
        },
        {
            title: "Revenue (MTD)",
            value: `Rs. ${Number(statsData.revenue).toLocaleString()}`,
            icon: TrendingUp,
            iconBgColor: (t) => t.palette.success.light,
            iconColor: (t) => t.palette.success.main,
            href: "/dashboard/bookings",
            subtitle: "Month to date",
        },
        {
            title: "Ready for Delivery",
            value: statsData.pendingDelivery.toLocaleString(),
            icon: Clock,
            iconBgColor: (t) => t.palette.warning.light,
            iconColor: (t) => t.palette.warning.main,
            href: "/dashboard/bookings?status=READY",
            subtitle: "Awaiting pickup",
        },
    ];

    const quickActions = [
        {
            title: "New Order",
            icon: Plus,
            iconBgColor: (t) => t.palette.primary.light,
            iconColor: (t) => t.palette.primary.main,
            href: "/dashboard/bookings",
        },
        {
            title: "Add Customer",
            icon: Users,
            iconBgColor: (t) => t.palette.success.light,
            iconColor: (t) => t.palette.success.main,
            href: "/dashboard/customers",
        },
        {
            title: "Add Product",
            icon: Package,
            iconBgColor: (t) => t.palette.info.light,
            iconColor: (t) => t.palette.info.main,
            href: "/dashboard/products",
        },
        {
            title: "Purchases",
            icon: ShoppingBag,
            iconBgColor: (t) => t.palette.warning.light,
            iconColor: (t) => t.palette.warning.main,
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
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {stats.map((s) => (
                    <Grid item xs={3} key={s.title}>
                        <StatCard {...s} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Quick Actions ────────────────────────────────── */}
            <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {quickActions.map((a) => (
                    <Grid item xs={3} key={a.title}>
                        <ActionCard {...a} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Bottom row ───────────────────────────────────── */}
            <Grid container spacing={3}>

                {/* Recent Orders */}
                <Grid item xs={12} lg={8}>
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
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
                <Grid item xs={12} lg={4}>
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
                                    iconBgColor={(t) => t.palette.success.light}
                                    iconColor={(t) => t.palette.success.main}
                                    label="Completed Orders"
                                    value={statsData.completedToday}
                                />
                                <OverviewRow
                                    icon={Calendar}
                                    iconBgColor={(t) => t.palette.info.light}
                                    iconColor={(t) => t.palette.info.main}
                                    label="Scheduled Trials"
                                    value={statsData.trialsToday}
                                />
                                <OverviewRow
                                    icon={DollarSign}
                                    iconBgColor={(t) => t.palette.warning.light}
                                    iconColor={(t) => t.palette.warning.main}
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
