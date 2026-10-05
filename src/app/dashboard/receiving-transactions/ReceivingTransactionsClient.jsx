"use client";

import { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    CircularProgress,
    Tooltip,
    useTheme,
    Chip,
    Card
} from "@mui/material";
import {
    Search,
    RotateCcw,
    Printer,
    TrendingUp,
    Percent,
    FileText,
    Calendar
} from "lucide-react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";

export default function ReceivingTransactionsClient({ initialData }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const { data: session } = useSession();
    const canView = checkPermission(session, "receiving-transactions", "view") || checkPermission(session, "ledger", "view");

    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const initialToday = initialData?.dateFrom || getTodayString();

    // Filter states
    const [source, setSource] = useState("ALL"); // ALL | PRODUCT | STITCHING | LEDGER
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Date range filter states - defaults to current date (TODAY)
    const [datePreset, setDatePreset] = useState(initialData?.datePreset || "TODAY");
    const [dateFrom, setDateFrom] = useState(initialData?.dateFrom || initialToday);
    const [dateTo, setDateTo] = useState(initialData?.dateTo || initialToday);

    // Sorting states
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");

    // Pagination states
    const [page, setPage] = useState(1);
    const limit = 12;

    // Data states
    const [transactions, setTransactions] = useState(initialData?.transactions || []);
    const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
    const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
    const [summary, setSummary] = useState(initialData?.summary || {
        total: { amount: 0, count: 0 },
        product: { amount: 0, count: 0 },
        stitching: { amount: 0, count: 0 },
        ledger: { amount: 0, count: 0 },
        cash: { amount: 0, count: 0 },
        bank: { amount: 0, count: 0 }
    });
    const [loading, setLoading] = useState(false);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch transactions
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                source,
                sortBy,
                sortOrder
            });

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }
            if (dateFrom) {
                params.append("dateFrom", dateFrom);
            }
            if (dateTo) {
                params.append("dateTo", dateTo);
            }

            const res = await fetch(`/api/receiving-transactions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
                setTotalCount(data.totalCount || 0);
                setTotalPages(data.totalPages || 1);
                if (data.summary) {
                    setSummary(data.summary);
                }
            }
        } catch (error) {
            console.error("Failed to load receiving transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when dependencies change
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        fetchTransactions();
    }, [page, source, debouncedSearch, dateFrom, dateTo, sortBy, sortOrder]);

    const formatYMD = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const applyDatePreset = (preset) => {
        setDatePreset(preset);
        const now = new Date();
        if (preset === "ALL") {
            setDateFrom("");
            setDateTo("");
        } else if (preset === "TODAY") {
            const todayStr = formatYMD(now);
            setDateFrom(todayStr);
            setDateTo(todayStr);
        } else if (preset === "YESTERDAY") {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = formatYMD(y);
            setDateFrom(yStr);
            setDateTo(yStr);
        } else if (preset === "THIS_MONTH") {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setDateFrom(formatYMD(firstDay));
            setDateTo(formatYMD(lastDay));
        }
        setPage(1);
    };

    const startRange = totalCount === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, totalCount);

    const getPageNumbers = () => {
        const pages = [];
        const maxButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleCardClick = (cardSource) => {
        if (source === cardSource && cardSource !== "ALL") {
            setSource("ALL");
        } else {
            setSource(cardSource);
        }
        setPage(1);
    };

    if (!canView) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="error">
                    You do not have permission to view receiving transactions.
                </Typography>
            </Box>
        );
    }

    const getSubtitle = () => {
        if (datePreset === "TODAY") return "Today's Transactions";
        if (datePreset === "YESTERDAY") return "Yesterday's Transactions";
        if (datePreset === "THIS_MONTH") return "This Month's Transactions";
        if (dateFrom && dateTo) {
            return `Transactions from ${dateFrom} to ${dateTo}`;
        }
        if (dateFrom) return `Transactions from ${dateFrom}`;
        if (dateTo) return `Transactions up to ${dateTo}`;
        return "All Recent Transactions";
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", py: 2.5, px: { xs: 1.5, sm: 3 } }}>
            {/* Top Header: Title, Subtitle, and Top Pagination */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "text.primary",
                            fontSize: { xs: "1.35rem", sm: "1.65rem" }
                        }}
                    >
                        Transaction Roster
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            mt: 0.25,
                            fontSize: "0.88rem",
                            fontWeight: 500
                        }}
                    >
                        {getSubtitle()}
                    </Typography>
                </Box>

                {/* Top Pagination matching reference */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                        size="small"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        sx={{
                            textTransform: "none",
                            color: page <= 1 ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Prev
                    </Button>

                    {getPageNumbers().map(pageNum => (
                        <Button
                            key={pageNum}
                            size="small"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                            sx={{
                                minWidth: 28,
                                height: 28,
                                p: 0,
                                borderRadius: 1,
                                fontSize: "0.85rem",
                                fontWeight: pageNum === page ? 700 : 500,
                                color: pageNum === page ? "#ffffff" : "text.secondary",
                                bgcolor: pageNum === page ? "#2563eb" : "transparent",
                                "&:hover": {
                                    bgcolor: pageNum === page ? "#1d4ed8" : "action.hover",
                                    color: pageNum === page ? "#ffffff" : "text.primary"
                                }
                            }}
                        >
                            {pageNum}
                        </Button>
                    ))}

                    <Button
                        size="small"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        sx={{
                            textTransform: "none",
                            color: page >= totalPages ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            {/* Date Range Selection Bar: Direct 2 Date Pickers + Quick Presets + Search */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 2.5,
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1.5
                }}
            >
                {/* 1. Date Range: Two Date Pickers */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.76rem" }}>
                            From:
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setDatePreset("CUSTOM");
                                setPage(1);
                            }}
                            sx={{
                                width: 145,
                                "& .MuiInputBase-root": { height: 34, fontSize: "0.82rem", borderRadius: 1.5 }
                            }}
                        />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.76rem" }}>
                            To:
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setDatePreset("CUSTOM");
                                setPage(1);
                            }}
                            sx={{
                                width: 145,
                                "& .MuiInputBase-root": { height: 34, fontSize: "0.82rem", borderRadius: 1.5 }
                            }}
                        />
                    </Box>
                </Box>

                {/* 2. Quick Range Presets */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                    {[
                        { label: "Today", value: "TODAY" },
                        { label: "Yesterday", value: "YESTERDAY" },
                        { label: "This Month", value: "THIS_MONTH" },
                        { label: "All Time", value: "ALL" }
                    ].map((p) => {
                        const isPresetActive = datePreset === p.value;
                        return (
                            <Chip
                                key={p.value}
                                label={p.label}
                                size="small"
                                clickable
                                onClick={() => applyDatePreset(p.value)}
                                color={isPresetActive ? "primary" : "default"}
                                variant={isPresetActive ? "filled" : "outlined"}
                                sx={{
                                    height: 30,
                                    fontSize: "0.76rem",
                                    fontWeight: isPresetActive ? 700 : 500,
                                    borderRadius: 1.5,
                                    ...(isPresetActive
                                        ? { bgcolor: "#2563eb", color: "#fff" }
                                        : { bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc" })
                                }}
                            />
                        );
                    })}
                </Box>

                {/* 3. Search and Actions */}
                <Box sx={{ ml: { xs: 0, lg: "auto" }, display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
                    <TextField
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search receipt, customer..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={14} style={{ opacity: 0.55 }} />
                                </InputAdornment>
                            ),
                            sx: { height: 34, fontSize: "0.82rem", width: { xs: "100%", sm: 220 }, borderRadius: 1.5 }
                        }}
                    />
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={fetchTransactions} disabled={loading}>
                            <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print List">
                        <IconButton size="small" onClick={() => window.print()}>
                            <Printer size={16} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Transaction Roster Container matching exact reference screenshot (Full Width) */}
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    overflow: "hidden",
                    mb: 2.5
                }}
            >
                {loading && transactions.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, fontWeight: 500 }}>
                            Loading transaction roster...
                        </Typography>
                    </Box>
                ) : transactions.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            No transactions found for the selected date
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
                            Try selecting another date range or click "All Time" to view all records.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <Box sx={{ minWidth: 960, width: "100%" }}>
                            {transactions.map((tx, idx) => {
                                const isFirst = idx === 0;
                                return (
                                    <Box
                                        key={tx.id || idx}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "170px 115px 165px 145px 135px 1fr 95px 145px",
                                            alignItems: "center",
                                            py: 2,
                                            px: 2.5,
                                            borderBottom: idx === transactions.length - 1 ? "none" : "1px solid",
                                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                            transition: "background-color 0.15s ease",
                                            "&:hover": {
                                                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"
                                            }
                                        }}
                                    >
                                        {/* Col 1: Receipt Badge #REC-202609-0544-7145 */}
                                        <Box>
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    px: 1.25,
                                                    py: 0.4,
                                                    borderRadius: 1.5,
                                                    bgcolor: isDark ? "rgba(37, 99, 235, 0.15)" : "#eff6ff",
                                                    border: "1px solid",
                                                    borderColor: isDark ? "rgba(37, 99, 235, 0.35)" : "#bfdbfe",
                                                    color: "#2563eb",
                                                    fontWeight: 700,
                                                    fontSize: "0.76rem",
                                                    letterSpacing: "0.01em",
                                                    whiteSpace: "nowrap"
                                                }}
                                            >
                                                #{tx.receiptNo}
                                            </Box>
                                        </Box>

                                        {/* Col 2: Date & Time */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.84rem",
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.formattedDate}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.formattedTime || "--"}
                                            </Typography>
                                        </Box>

                                        {/* Col 3: Source (From Booking / Booking #...) */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.receivingType || "From Booking"}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.74rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.sourceRef || "Customer Ledger"}
                                            </Typography>
                                        </Box>

                                        {/* Col 4: Customer Name & Phone / Code */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.88rem",
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.accountName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.accountOver}
                                            </Typography>
                                        </Box>

                                        {/* Col 5: Pink/Magenta Dot + Address */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden" }}>
                                            <Box
                                                sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    bgcolor: "#ec4899",
                                                    flexShrink: 0
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontSize: "0.82rem",
                                                    color: "text.secondary",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}
                                                title={tx.address || ""}
                                            >
                                                {tx.address || "—"}
                                            </Typography>
                                        </Box>

                                        {/* Col 6: Description */}
                                        <Box sx={{ pr: 1.5 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.84rem",
                                                    color: "text.secondary",
                                                    lineHeight: 1.35,
                                                    wordBreak: "break-word"
                                                }}
                                            >
                                                {tx.description}
                                            </Typography>
                                        </Box>

                                        {/* Col 7: Payment Mode Badge (Cash / Bank) */}
                                        <Box>
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    px: 1.5,
                                                    py: 0.25,
                                                    borderRadius: 1.5,
                                                    border: "1px solid",
                                                    borderColor: tx.paymentMethod?.toLowerCase().includes("bank") ? "#8b5cf6" : "#10b981",
                                                    color: tx.paymentMethod?.toLowerCase().includes("bank") ? "#7c3aed" : "#059669",
                                                    bgcolor: tx.paymentMethod?.toLowerCase().includes("bank")
                                                        ? (isDark ? "rgba(139, 92, 246, 0.12)" : "#f5f3ff")
                                                        : (isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5"),
                                                    fontWeight: 600,
                                                    fontSize: "0.76rem"
                                                }}
                                            >
                                                {tx.paymentMethod?.toLowerCase().includes("bank") ? "Bank" : "Cash"}
                                            </Box>
                                        </Box>

                                        {/* Col 8: Receiving Amount (with Header on row 1 matching design) */}
                                        <Box sx={{ textAlign: "right", pl: 1 }}>
                                            {isFirst && (
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.76rem",
                                                        fontWeight: 600,
                                                        color: "text.secondary",
                                                        mb: 0.4,
                                                        lineHeight: 1.1
                                                    }}
                                                >
                                                    Receiving Amount
                                                </Typography>
                                            )}
                                            <Typography
                                                sx={{
                                                    fontSize: "0.96rem",
                                                    fontWeight: 700,
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.amount === 0 ? "0" : tx.amount.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Bottom Bar: Showing range and Bottom Pagination */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 3,
                    px: 0.5
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        fontSize: "0.85rem",
                        fontWeight: 500
                    }}
                >
                    Showing {startRange}-{endRange} of {totalCount}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                        size="small"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        sx={{
                            textTransform: "none",
                            color: page <= 1 ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Prev
                    </Button>

                    {getPageNumbers().map(pageNum => (
                        <Button
                            key={pageNum}
                            size="small"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                            sx={{
                                minWidth: 28,
                                height: 28,
                                p: 0,
                                borderRadius: 1,
                                fontSize: "0.85rem",
                                fontWeight: pageNum === page ? 700 : 500,
                                color: pageNum === page ? "#ffffff" : "text.secondary",
                                bgcolor: pageNum === page ? "#2563eb" : "transparent",
                                "&:hover": {
                                    bgcolor: pageNum === page ? "#1d4ed8" : "action.hover",
                                    color: pageNum === page ? "#ffffff" : "text.primary"
                                }
                            }}
                        >
                            {pageNum}
                        </Button>
                    ))}

                    <Button
                        size="small"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        sx={{
                            textTransform: "none",
                            color: page >= totalPages ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            {/* 4 Summary Cards at Bottom (Expanded Full Width CSS Grid) */}
            <Box
                sx={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                    gap: 2.5
                }}
            >
                {/* 1. Total Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("ALL")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
                        border: "1px solid",
                        borderColor: source === "ALL" ? "#10b981" : isDark ? "rgba(16, 185, 129, 0.3)" : "#a7f3d0",
                        boxShadow: source === "ALL" ? "0 4px 16px rgba(16, 185, 129, 0.2)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.15)"
                        }
                    }}
                >
                    {/* Sparkline decoration in top right */}
                    <Box sx={{ position: "absolute", top: 16, right: 16, opacity: 0.85 }}>
                        <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2 18 C 12 18, 16 6, 26 10 C 36 14, 44 2, 58 4"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5",
                                color: "#059669"
                            }}
                        >
                            <TrendingUp size={20} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Total Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "#059669",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        Rs. {summary.total.amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {summary.total.count.toLocaleString()} transactions
                    </Typography>
                </Card>

                {/* 2. Product Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("PRODUCT")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "PRODUCT" ? "#2563eb" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "PRODUCT" ? "0 4px 16px rgba(37, 99, 235, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Product Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        Rs. {summary.product.amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {summary.product.count.toLocaleString()} product sales recorded
                    </Typography>
                </Card>

                {/* 3. Stitching Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("STITCHING")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "STITCHING" ? "#7c3aed" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "STITCHING" ? "0 4px 16px rgba(124, 58, 237, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(124, 58, 237, 0.15)" : "#f1f5f9",
                                color: isDark ? "#a78bfa" : "#64748b"
                            }}
                        >
                            <Percent size={16} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Stitching Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        Rs. {summary.stitching.amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {summary.stitching.count.toLocaleString()} stitching transactions
                    </Typography>
                </Card>

                {/* 4. Ledger Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("LEDGER")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "LEDGER" ? "#d97706" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "LEDGER" ? "0 4px 16px rgba(217, 119, 6, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(217, 119, 6, 0.15)" : "#f1f5f9",
                                color: isDark ? "#fbbf24" : "#64748b"
                            }}
                        >
                            <FileText size={16} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Ledger Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        Rs. {summary.ledger.amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {summary.ledger.count.toLocaleString()} ledger transactions
                    </Typography>
                </Card>
            </Box>
        </Box>
    );
}
