"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
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
    BarChart3,
    PieChart as PieIcon,
    Sparkles,
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
    Tabs,
    Tab,
} from "@mui/material";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";

/* ─── helpers ─────────────────────────────────────────────── */

function statusColor(status) {
    switch (status) {
        case "COMPLETED":
        case "DELIVERED":
            return "success";
        case "READY":
            return "primary";
        case "PENDING":
        case "TRIAL":
        case "STITCHING":
        case "CUTTING":
        case "MEASUREMENT_TAKEN":
            return "warning";
        case "RETURNED":
        case "CANCELLED":
            return "error";
        default:
            return "default";
    }
}

function statusLabel(status) {
    return status?.replace(/_/g, " ") ?? "";
}

const STATUS_PALETTE = {
    PENDING: "#F59E0B",
    MEASUREMENT_TAKEN: "#3B82F6",
    CUTTING: "#8B5CF6",
    STITCHING: "#EC4899",
    TRIAL: "#10B981",
    READY: "#06B6D4",
    DELIVERED: "#059669",
    COMPLETED: "#10B981",
    CANCELLED: "#EF4444",
};

/* ─── Sharp Metric Card (0px Border Radius) ─────────────────── */
function StatCard({ title, value, icon: Icon, gradient, shadowColor, href, subtitle, badgeText }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 0,
                border: "1px solid rgba(226, 232, 240, 0.95)",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
                    borderColor: "primary.main",
                },
            }}
        >
            <CardActionArea component={Link} href={href} sx={{ height: "100%", borderRadius: 0 }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 0,
                                background: gradient,
                                color: "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            }}
                        >
                            <Icon size={22} strokeWidth={2.2} />
                        </Box>
                        {badgeText && (
                            <Chip
                                label={badgeText}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: "0.6875rem",
                                    fontWeight: 700,
                                    borderRadius: 0,
                                    bgcolor: "#F1F5F9",
                                    color: "#475569",
                                }}
                            />
                        )}
                    </Box>

                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "#64748B",
                            display: "block",
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: "#0F172A",
                            mt: 0.5,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        {value}
                    </Typography>

                    {subtitle && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                                {subtitle}
                            </Typography>
                            <ChevronRight size={14} color="#94A3B8" />
                        </Box>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

/* ─── Sharp Action Card (0px Border Radius) ─────────────────── */
function ActionCard({ title, subtitle, icon: Icon, gradient, href }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 0,
                border: "1px solid rgba(226, 232, 240, 0.95)",
                backgroundColor: "#FFFFFF",
                transition: "all 0.18s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 14px -2px rgba(0, 0, 0, 0.06)",
                    borderColor: "primary.main",
                },
            }}
        >
            <CardActionArea component={Link} href={href} sx={{ height: "100%", borderRadius: 0 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 0,
                            background: gradient,
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon size={19} strokeWidth={2.2} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0F172A" noWrap>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <ChevronRight size={16} color="#CBD5E1" />
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

/* ─── Sharp Overview Row (0px Border Radius) ────────────────── */
function OverviewRow({ icon: Icon, gradient, label, value }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.75,
                borderRadius: 0,
                bgcolor: "#F8FAFC",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                transition: "all 0.15s ease",
                "&:hover": {
                    bgcolor: "#F1F5F9",
                    borderLeft: "3px solid #2563EB",
                },
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 0,
                        background: gradient,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Icon size={18} strokeWidth={2.2} />
                </Box>
                <Typography variant="body2" fontWeight={600} color="#334155">
                    {label}
                </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                {value}
            </Typography>
        </Box>
    );
}

/* ─── Main Dashboard Client Component ─────────────────────── */
export default function DashboardClient({ statsData, recentOrders, session, branches = [], initialChartData = {} }) {
    const isAdminUser = session?.user?.role === "ADMIN";
    const ownBranchId = session?.user?.branchId ? String(session.user.branchId) : null;
    const [selectedBranchId, setSelectedBranchId] = useState(isAdminUser ? "ALL" : (ownBranchId || "ALL"));
    const [currentStats, setCurrentStats] = useState(statsData);
    const [currentRecentOrders, setCurrentRecentOrders] = useState(recentOrders);
    const [chartData, setChartData] = useState(initialChartData);
    const [loadingStats, setLoadingStats] = useState(false);
    const [activeChartTab, setActiveChartTab] = useState(0);

    const handleBranchChange = useCallback(async (newBranchId) => {
        setSelectedBranchId(newBranchId);
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/dashboard/stats?branchId=${newBranchId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentStats(data.statsData);
                setCurrentRecentOrders(data.recentOrders);
                if (data.chartData) {
                    setChartData(data.chartData);
                }
            }
        } catch (err) {
            console.error("Failed to fetch branch stats:", err);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    // Non-admin users: load stats for their own branch only (server enforces this too)
    useEffect(() => {
        if (!isAdminUser) {
            handleBranchChange(ownBranchId || "ALL");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminUser, ownBranchId]);

    const selectedBranchObj = branches.find((b) => b.id.toString() === selectedBranchId.toString());

    const stats = [
        {
            title: "Total Customers",
            value: (currentStats.totalCustomers || 0).toLocaleString(),
            icon: Users,
            gradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            href: "/dashboard/customers",
            subtitle: "Registered client accounts",
            badgeText: "Accounts",
        },
        {
            title: "Active Orders",
            value: (currentStats.activeOrders || 0).toLocaleString(),
            icon: Scissors,
            gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            href: "/dashboard/bookings",
            subtitle: selectedBranchObj ? `${selectedBranchObj.name} in progress` : "All branches in progress",
            badgeText: "In Stitching",
        },
        {
            title: "Revenue (MTD)",
            value: `Rs. ${Number(currentStats.revenue || 0).toLocaleString()}`,
            icon: TrendingUp,
            gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            href: "/dashboard/analytics",
            subtitle: "Month to date revenue",
            badgeText: "Financial",
        },
        {
            title: "Ready for Delivery",
            value: (currentStats.pendingDelivery || 0).toLocaleString(),
            icon: Clock,
            gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            href: "/dashboard/bookings?status=READY",
            subtitle: "Awaiting customer pickup",
            badgeText: "Ready",
        },
    ];

    const quickActions = [
        {
            title: "New Booking",
            subtitle: "Create customer order",
            icon: Plus,
            gradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            href: "/dashboard/bookings",
        },
        {
            title: "Add Customer",
            subtitle: "Register new client",
            icon: Users,
            gradient: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
            href: "/dashboard/customers",
        },
        {
            title: "Inventory",
            subtitle: "Check fabric & suits",
            icon: Package,
            gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            href: "/dashboard/products",
        },
        {
            title: "New Purchase",
            subtitle: "Stock procurement",
            icon: ShoppingBag,
            gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            href: "/dashboard/purchases",
        },
    ];

    const greetingName = session?.user?.name || session?.user?.fullName || "Waqas Umar";

    // Chart preparation
    const dailyTrends = chartData?.dailyTrends || [];
    const statusDistribution = (chartData?.statusDistribution || []).map((s) => ({
        ...s,
        color: STATUS_PALETTE[s.status] || "#64748B",
    }));

    const chartDays = dailyTrends.map((d) => d.day);
    const chartRevenues = dailyTrends.map((d) => d.revenue);
    const chartOrders = dailyTrends.map((d) => d.orders);
    const chartDelivered = dailyTrends.map((d) => d.delivered);

    return (
        <Box sx={{ width: "100%", py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3.5 } }}>
            {/* ── Welcome Banner ─────────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    alignItems: { md: "center" },
                    gap: 2.5,
                    mb: 3.5,
                }}
            >
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: "#0F172A",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Welcome back, {greetingName}
                        </Typography>
                        <Sparkles size={20} color="#F59E0B" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.875rem" }}>
                        Real-time operations, daily performance metrics, and workflow tracking.
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    {/* Branch Switcher Select */}
                    {isAdminUser && branches.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <Select
                                value={selectedBranchId}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                displayEmpty
                                disabled={loadingStats}
                                startAdornment={
                                    loadingStats ? (
                                        <CircularProgress size={16} sx={{ mr: 1, color: "primary.main" }} />
                                    ) : (
                                        <Building2 size={16} style={{ marginRight: 8, color: "#2563EB" }} />
                                    )
                                }
                                sx={{
                                    borderRadius: 0,
                                    bgcolor: "#FFFFFF",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    "& fieldset": { borderColor: "rgba(226, 232, 240, 0.95)", borderRadius: 0 },
                                    "&:hover fieldset": { borderColor: "primary.main" },
                                }}
                            >
                                <MenuItem value="ALL" sx={{ fontWeight: 600, borderRadius: 0 }}>
                                    All Branches (Combined)
                                </MenuItem>
                                {branches.map((b) => (
                                    <MenuItem key={b.id} value={b.id.toString()} sx={{ borderRadius: 0 }}>
                                        {b.name} {b.code ? `(${b.code})` : ""}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* New Booking CTA */}
                    <Button
                        variant="contained"
                        size="medium"
                        startIcon={<Plus size={18} />}
                        component={Link}
                        href="/dashboard/bookings"
                        sx={{
                            borderRadius: 0,
                            px: 2.5,
                            py: 0.9,
                            fontWeight: 700,
                            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                        }}
                    >
                        New Order
                    </Button>
                </Box>
            </Box>

            {/* ── Stat Cards Grid (Sharp Geometric 0px) ───────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {stats.map((s) => (
                    <Grid key={s.title} size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard {...s} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Visual Graphs and Charts Section ────────────────── */}
            <Card
                elevation={0}
                sx={{
                    mb: 3.5,
                    borderRadius: 0,
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                }}
            >
                {/* Header with Title and View Switcher Tabs */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { sm: "center" },
                        gap: 2,
                        borderBottom: "1px solid rgba(226, 232, 240, 0.95)",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "rgba(37, 99, 235, 0.08)",
                                color: "primary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 0,
                            }}
                        >
                            <BarChart3 size={20} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                                Performance Analytics & Trends
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Visual trajectories over the past 7 days and current order pipeline distribution
                            </Typography>
                        </Box>
                    </Box>

                    <Tabs
                        value={activeChartTab}
                        onChange={(e, v) => setActiveChartTab(v)}
                        sx={{
                            minHeight: 36,
                            "& .MuiTabs-indicator": { borderRadius: 0 },
                        }}
                    >
                        <Tab
                            label="Revenue Trend (7 Days)"
                            sx={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                minHeight: 36,
                                py: 0.5,
                                px: 1.5,
                                borderRadius: 0,
                            }}
                        />
                        <Tab
                            label="Bookings vs Deliveries"
                            sx={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                minHeight: 36,
                                py: 0.5,
                                px: 1.5,
                                borderRadius: 0,
                            }}
                        />
                    </Tabs>
                </Box>

                {/* Chart Body Grid */}
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={3}>
                        {/* Primary Trend Chart (Line / Bar) */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                    {activeChartTab === 0 ? "Daily Revenue Generation (PKR)" : "Daily Production Flow (Orders)"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Last 7 Active Days
                                </Typography>
                            </Box>

                            {dailyTrends.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: "center", bgcolor: "#F8FAFC" }}>
                                    <Typography color="text.secondary">No chart trend records found.</Typography>
                                </Box>
                            ) : activeChartTab === 0 ? (
                                <Box sx={{ width: "100%", height: 320 }}>
                                    <BarChart
                                        xAxis={[{ scaleType: "band", data: chartDays }]}
                                        series={[
                                            {
                                                data: chartRevenues,
                                                label: "Revenue (PKR)",
                                                color: "#2563EB",
                                                valueFormatter: (v) => `Rs. ${(v || 0).toLocaleString()}`,
                                            },
                                        ]}
                                        height={310}
                                        margin={{ left: 65, right: 20, top: 20, bottom: 30 }}
                                        borderRadius={0}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ width: "100%", height: 320 }}>
                                    <BarChart
                                        xAxis={[{ scaleType: "band", data: chartDays }]}
                                        series={[
                                            {
                                                data: chartOrders,
                                                label: "Orders Booked",
                                                color: "#3B82F6",
                                            },
                                            {
                                                data: chartDelivered,
                                                label: "Orders Delivered",
                                                color: "#10B981",
                                            },
                                        ]}
                                        height={310}
                                        margin={{ left: 45, right: 20, top: 20, bottom: 30 }}
                                        borderRadius={0}
                                    />
                                </Box>
                            )}
                        </Grid>

                        {/* Status Pipeline Donut Chart */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                    Order Status Pipeline
                                </Typography>
                                <Chip
                                    label="Live Breakdown"
                                    size="small"
                                    sx={{ height: 18, fontSize: "0.625rem", fontWeight: 700, borderRadius: 0 }}
                                />
                            </Box>

                            {statusDistribution.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: "center", bgcolor: "#F8FAFC" }}>
                                    <Typography color="text.secondary">No status distribution records.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Box sx={{ width: "100%", height: 220 }}>
                                        <PieChart
                                            series={[
                                                {
                                                    data: statusDistribution,
                                                    innerRadius: 48,
                                                    outerRadius: 85,
                                                    paddingAngle: 2,
                                                    cornerRadius: 0,
                                                    highlightScope: { fade: "global", highlight: "item" },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                                                },
                                            ]}
                                            height={210}
                                            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            slotProps={{
                                                legend: { hidden: true },
                                            }}
                                        />
                                    </Box>

                                    {/* Sharp Legend List */}
                                    <Box sx={{ width: "100%", mt: 1, maxHeight: 110, overflowY: "auto" }}>
                                        <Grid container spacing={1}>
                                            {statusDistribution.map((s) => (
                                                <Grid key={s.label} size={{ xs: 6 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 10,
                                                                height: 10,
                                                                bgcolor: s.color,
                                                                borderRadius: 0,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: "0.725rem",
                                                                fontWeight: 600,
                                                                color: "#334155",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {s.label}: <strong>{s.value}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* ── Quick Operations ─────────────────────────────────── */}
            <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 800,
                            color: "#0F172A",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Quick Operations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Fast access to core tailoring workflows
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    {quickActions.map((a) => (
                        <Grid key={a.title} size={{ xs: 12, sm: 6, md: 3 }}>
                            <ActionCard {...a} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* ── Bottom Section: Recent Orders & Today Overview ───── */}
            <Grid container spacing={3}>
                {/* Recent Orders List Card */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            borderRadius: 0,
                            border: "1px solid rgba(226, 232, 240, 0.95)",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1px solid rgba(226, 232, 240, 0.95)",
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                                    Recent Bookings & Orders
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Latest active tailor orders and status tracker
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/dashboard/bookings"
                                size="small"
                                endIcon={<ChevronRight size={16} />}
                                sx={{
                                    fontWeight: 700,
                                    borderRadius: 0,
                                    color: "primary.main",
                                    bgcolor: "rgba(37, 99, 235, 0.06)",
                                    "&:hover": {
                                        bgcolor: "rgba(37, 99, 235, 0.12)",
                                    },
                                }}
                            >
                                View all bookings
                            </Button>
                        </Box>

                        {currentRecentOrders.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: "center" }}>
                                <Scissors size={36} color="#CBD5E1" />
                                <Typography color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
                                    No orders found for the selected branch filter.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {currentRecentOrders.map((order, idx) => (
                                    <Box key={order.id}>
                                        <ListItemButton
                                            component={Link}
                                            href={`/dashboard/bookings`}
                                            sx={{
                                                px: 3,
                                                py: 1.5,
                                                borderRadius: 0,
                                                transition: "background-color 0.15s ease",
                                                "&:hover": {
                                                    bgcolor: "rgba(241, 245, 249, 0.7)",
                                                    borderLeft: "3px solid #2563EB",
                                                },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    variant="square"
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                                                        color: "#FFFFFF",
                                                        fontWeight: 700,
                                                        fontSize: "0.85rem",
                                                        borderRadius: 0,
                                                    }}
                                                >
                                                    {order.avatar}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            fontWeight={700}
                                                            color="#0F172A"
                                                            className="font-urdu"
                                                            sx={{ fontSize: "1rem" }}
                                                        >
                                                            {order.customer}
                                                        </Typography>
                                                        {order.branchName && (
                                                            <Chip
                                                                size="small"
                                                                label={order.branchName}
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: "0.65rem",
                                                                    fontWeight: 600,
                                                                    bgcolor: "#F1F5F9",
                                                                    color: "#475569",
                                                                    borderRadius: 0,
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="caption" sx={{ color: "#64748B", mt: 0.25, display: "block" }}>
                                                        <span style={{ fontWeight: 600, color: "#1E293B" }}>
                                                            {order.bookingNumber}
                                                        </span>
                                                        {" • "}
                                                        {order.items} item{order.items !== 1 ? "s" : ""}
                                                        {order.daysRemaining !== 0 && (
                                                            <>
                                                                {" • "}
                                                                <span
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        color: order.daysRemaining > 0 ? "#10B981" : "#EF4444",
                                                                    }}
                                                                >
                                                                    {order.daysRemaining > 0
                                                                        ? `${order.daysRemaining}d left`
                                                                        : `${Math.abs(order.daysRemaining)}d overdue`}
                                                                </span>
                                                            </>
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                            <Chip
                                                label={statusLabel(order.status)}
                                                size="small"
                                                color={statusColor(order.status)}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.725rem",
                                                    borderRadius: 0,
                                                    px: 0.5,
                                                    ml: 1.5,
                                                }}
                                            />
                                        </ListItemButton>
                                        {idx < currentRecentOrders.length - 1 && (
                                            <Divider component="li" sx={{ borderColor: "rgba(241, 245, 249, 0.95)" }} />
                                        )}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Card>
                </Grid>

                {/* Today's Overview Card */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            borderRadius: 0,
                            border: "1px solid rgba(226, 232, 240, 0.95)",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid rgba(226, 232, 240, 0.95)",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                                Today&apos;s Operations
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date().toLocaleDateString("en-PK", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 2.5 }}>
                            <Stack spacing={1.75}>
                                <OverviewRow
                                    icon={CheckCircle2}
                                    gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                    label="Completed & Delivered"
                                    value={currentStats.completedToday || 0}
                                />
                                <OverviewRow
                                    icon={Calendar}
                                    gradient="linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
                                    label="Scheduled Trials Today"
                                    value={currentStats.trialsToday || 0}
                                />
                                <OverviewRow
                                    icon={DollarSign}
                                    gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                                    label="Revenue Generated"
                                    value={`Rs. ${Number(currentStats.revenueToday || 0).toLocaleString()}`}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
