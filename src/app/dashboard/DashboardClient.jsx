"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
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
    Building2,
    RefreshCw,
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
    FormControl,
    Select,
    MenuItem,
    CircularProgress,
} from "@mui/material";

/* ─── helpers ─────────────────────────────────────────────── */

/** Returns the right MUI Chip color for each booking status */
function statusColor(status) {
    switch (status) {
        case "COMPLETED":
        case "DELIVERED": return "success";
        case "READY": return "primary";
        case "PENDING":
        case "TRIAL":
        case "STITCHING":
        case "CUTTING":
        case "MEASUREMENT_TAKEN": return "warning";
        case "RETURNED":
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
export default function DashboardClient({ statsData, recentOrders, session, branches = [] }) {
    const [selectedBranchId, setSelectedBranchId] = useState("ALL");
    const [currentStats, setCurrentStats] = useState(statsData);
    const [currentRecentOrders, setCurrentRecentOrders] = useState(recentOrders);
    const [loadingStats, setLoadingStats] = useState(false);

    const handleBranchChange = useCallback(async (newBranchId) => {
        setSelectedBranchId(newBranchId);
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/dashboard/stats?branchId=${newBranchId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentStats(data.statsData);
                setCurrentRecentOrders(data.recentOrders);
            }
        } catch (err) {
            console.error("Failed to fetch branch stats:", err);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const selectedBranchObj = branches.find(b => b.id.toString() === selectedBranchId.toString());

    const stats = [
        {
            title: "Total Customers",
            value: (currentStats.totalCustomers || 0).toLocaleString(),
            icon: Users,
            iconBgColor: (t) => t.palette.primary.light,
            iconColor: (t) => t.palette.primary.main,
            href: "/dashboard/customers",
            subtitle: "Registered accounts",
        },
        {
            title: "Active Orders",
            value: (currentStats.activeOrders || 0).toLocaleString(),
            icon: Scissors,
            iconBgColor: (t) => t.palette.secondary.light,
            iconColor: (t) => t.palette.secondary.main,
            href: "/dashboard/bookings",
            subtitle: selectedBranchObj ? `${selectedBranchObj.name} in progress` : "All branches in progress",
        },
        {
            title: "Revenue (MTD)",
            value: `Rs. ${Number(currentStats.revenue || 0).toLocaleString()}`,
            icon: TrendingUp,
            iconBgColor: (t) => t.palette.success.light,
            iconColor: (t) => t.palette.success.main,
            href: "/dashboard/analytics",
            subtitle: "Month to date",
        },
        {
            title: "Ready for Delivery",
            value: (currentStats.pendingDelivery || 0).toLocaleString(),
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    {branches.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 210 }}>
                            <Select
                                value={selectedBranchId}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                displayEmpty
                                disabled={loadingStats}
                                startAdornment={
                                    loadingStats ? (
                                        <CircularProgress size={16} sx={{ mr: 1, color: "text.secondary" }} />
                                    ) : (
                                        <Building2 size={16} style={{ marginRight: 8, color: "#6b7280" }} />
                                    )
                                }
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: "white",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    "& fieldset": { borderColor: "#e5e7eb" },
                                    "&:hover fieldset": { borderColor: "#6366f1" }
                                }}
                            >
                                <MenuItem value="ALL" sx={{ fontWeight: 600 }}>
                                    All Branches (Combined)
                                </MenuItem>
                                {branches.map((b) => (
                                    <MenuItem key={b.id} value={b.id.toString()}>
                                        {b.name} {b.code ? `(${b.code})` : ""}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
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
            </Box>

            {/* ── Stat cards ──────────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {stats.map((s) => (
                    <Grid key={s.title} size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid key={a.title} size={{ xs: 6, sm: 6, md: 3 }}>
                        <ActionCard {...a} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Bottom row ───────────────────────────────────── */}
            <Grid container spacing={3}>

                {/* Recent Orders */}
                <Grid size={{ xs: 12, lg: 8 }}>
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
                        {currentRecentOrders.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: "center" }}>
                                <Scissors size={36} color="#d1d5db" />
                                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                    No recent orders for this selection.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {currentRecentOrders.map((order, idx) => (
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
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                                            {order.customer}
                                                        </Typography>
                                                        {order.branchName && (
                                                            <Chip
                                                                size="small"
                                                                label={order.branchName}
                                                                sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#f3f4f6", color: "#4b5563" }}
                                                            />
                                                        )}
                                                    </Box>
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
                                        {idx < currentRecentOrders.length - 1 && <Divider component="li" />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Card>
                </Grid>

                {/* Today's Overview */}
                <Grid size={{ xs: 12, lg: 4 }}>
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
                                    value={currentStats.completedToday}
                                />
                                <OverviewRow
                                    icon={Calendar}
                                    iconBgColor={(t) => t.palette.info.light}
                                    iconColor={(t) => t.palette.info.main}
                                    label="Scheduled Trials"
                                    value={currentStats.trialsToday}
                                />
                                <OverviewRow
                                    icon={DollarSign}
                                    iconBgColor={(t) => t.palette.warning.light}
                                    iconColor={(t) => t.palette.warning.main}
                                    label="Revenue Today"
                                    value={`Rs. ${Number(currentStats.revenueToday).toLocaleString()}`}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

        </Box>
    );
}
