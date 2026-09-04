"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    Button,
    IconButton,
    CircularProgress,
    Tooltip,
    Popover,
    useTheme,
    Chip,
    Card,
    Grid
} from "@mui/material";
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Calendar,
    RotateCcw,
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    TrendingUp
} from "lucide-react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";

export default function ReceivingTransactionsClient({ initialData }) {
    const theme = useTheme();
    const { data: session } = useSession();
    const canView = checkPermission(session, "ledger", "view");

    // Filter states
    const [source, setSource] = useState("ALL"); // ALL | BOOKING | LEDGER
    const [status, setStatus] = useState("RECEIVED"); // RECEIVED | ALL
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Date range filter states
    const [datePreset, setDatePreset] = useState("ALL"); // ALL | TODAY | THIS_MONTH | LAST_MONTH | CUSTOM
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [datePickerAnchor, setDatePickerAnchor] = useState(null);

    // Sorting states
    const [sortBy, setSortBy] = useState("date"); // date | type | amount
    const [sortOrder, setSortOrder] = useState("desc"); // asc | desc

    // Pagination states
    const [page, setPage] = useState(1);
    const limit = 12; // Matching reference design showing 12 items per page

    // Data states
    const [transactions, setTransactions] = useState(initialData?.transactions || []);
    const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
    const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
    const [totalReceivedSum, setTotalReceivedSum] = useState(initialData?.totalReceivedSum || 0);
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
                status,
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
                setTotalReceivedSum(data.totalReceivedSum || 0);
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
            // If initialData exists and filters are at defaults, we don't need immediate refetch
            if (initialData?.transactions?.length > 0) return;
        }
        fetchTransactions();
    }, [page, source, status, debouncedSearch, dateFrom, dateTo, sortBy, sortOrder]);

    // Handle sort column click
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
        setPage(1);
    };

    // Calculate human-friendly Date Range label matching screenshot
    const dateRangeLabel = useMemo(() => {
        if (!dateFrom && !dateTo) {
            if (datePreset === "ALL") return "All Time";
            return "Date Range";
        }
        const formatMonthDay = (dateStr) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[d.getMonth()]} ${d.getDate()}`;
        };

        if (dateFrom && dateTo) {
            return `${formatMonthDay(dateFrom)} - ${formatMonthDay(dateTo)}`;
        }
        if (dateFrom) return `From ${formatMonthDay(dateFrom)}`;
        return `Until ${formatMonthDay(dateTo)}`;
    }, [dateFrom, dateTo, datePreset]);

    // Handle preset changes
    const applyDatePreset = (preset) => {
        setDatePreset(preset);
        const now = new Date();
        if (preset === "ALL") {
            setDateFrom("");
            setDateTo("");
        } else if (preset === "TODAY") {
            const todayStr = now.toISOString().split("T")[0];
            setDateFrom(todayStr);
            setDateTo(todayStr);
        } else if (preset === "THIS_MONTH") {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
            setDateFrom(firstDay);
            setDateTo(lastDay);
        } else if (preset === "LAST_MONTH") {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
            setDateFrom(firstDay);
            setDateTo(lastDay);
        }
        setPage(1);
        setDatePickerAnchor(null);
    };

    // Pagination helper
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

    // Render sort icon helper
    const renderSortIcon = (column) => {
        if (sortBy !== column) {
            return <ArrowUpDown size={14} style={{ opacity: 0.45, marginLeft: 4 }} />;
        }
        return sortOrder === "asc" ? (
            <ArrowUp size={14} style={{ color: theme.palette.primary.main, marginLeft: 4 }} />
        ) : (
            <ArrowDown size={14} style={{ color: theme.palette.primary.main, marginLeft: 4 }} />
        );
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

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", py: 2, px: { xs: 1, sm: 2 } }}>
            {/* Header section matching design */}
            <Box sx={{ mb: 2.5 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: "text.primary",
                        fontSize: { xs: "1.3rem", sm: "1.55rem" }
                    }}
                >
                    Transaction Roster
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        mt: 0.25,
                        fontSize: "0.875rem"
                    }}
                >
                    All Recent Transactions
                </Typography>
            </Box>

            {/* Filter Row matching exact layout in reference image */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1.5, md: 1.75 },
                    mb: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: { xs: 1.5, md: 2 }
                }}
            >
                {/* 1. Date Range Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Date Range:
                    </Typography>
                    <Button
                        size="small"
                        onClick={(e) => setDatePickerAnchor(e.currentTarget)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "text.primary",
                            fontSize: "0.875rem",
                            px: 1,
                            py: 0.25,
                            minWidth: "auto",
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            "&:hover": { bgcolor: "action.selected" }
                        }}
                    >
                        {dateRangeLabel}
                    </Button>
                </Box>

                {/* Vertical Divider */}
                <Box sx={{ height: 18, width: "1px", bgcolor: "divider", display: { xs: "none", sm: "block" } }} />

                {/* 2. Source Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Source:
                    </Typography>
                    <Select
                        size="small"
                        value={source}
                        onChange={(e) => {
                            setSource(e.target.value);
                            setPage(1);
                        }}
                        variant="standard"
                        disableUnderline
                        sx={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "text.primary",
                            "& .MuiSelect-select": { py: 0.25, pr: 3 }
                        }}
                    >
                        <MenuItem value="ALL">All</MenuItem>
                        <MenuItem value="BOOKING">From Booking</MenuItem>
                        <MenuItem value="LEDGER">Received through Ledger</MenuItem>
                    </Select>
                </Box>

                {/* Vertical Divider */}
                <Box sx={{ height: 18, width: "1px", bgcolor: "divider", display: { xs: "none", sm: "block" } }} />

                {/* 3. Status Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Status:
                    </Typography>
                    <Select
                        size="small"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        variant="standard"
                        disableUnderline
                        sx={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "text.primary",
                            "& .MuiSelect-select": { py: 0.25, pr: 3 }
                        }}
                    >
                        <MenuItem value="RECEIVED">Received</MenuItem>
                        <MenuItem value="ALL">All</MenuItem>
                    </Select>
                </Box>

                {/* Vertical Divider */}
                <Box sx={{ height: 18, width: "1px", bgcolor: "divider", display: { xs: "none", md: "block" } }} />

                {/* 4. Search Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: { xs: 1, md: 0 }, ml: { md: "auto" } }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Search:
                    </Typography>
                    <TextField
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={15} style={{ opacity: 0.55 }} />
                                </InputAdornment>
                            ),
                            sx: {
                                height: 34,
                                fontSize: "0.84rem",
                                width: { xs: "100%", sm: 220, md: 240 },
                                borderRadius: 1.5,
                                bgcolor: "background.paper",
                                "& fieldset": { borderColor: "divider" }
                            }
                        }}
                    />
                </Box>

                {/* Refresh and Print Actions */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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

            {/* Date Range Picker Popover */}
            <Popover
                open={Boolean(datePickerAnchor)}
                anchorEl={datePickerAnchor}
                onClose={() => setDatePickerAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                    sx: { p: 2, width: 280, borderRadius: 2, border: "1px solid", borderColor: "divider", mt: 0.5 }
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Select Date Range
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 2 }}>
                    <Button
                        size="small"
                        variant={datePreset === "ALL" ? "contained" : "outlined"}
                        onClick={() => applyDatePreset("ALL")}
                        sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem" }}
                    >
                        All Time
                    </Button>
                    <Button
                        size="small"
                        variant={datePreset === "TODAY" ? "contained" : "outlined"}
                        onClick={() => applyDatePreset("TODAY")}
                        sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem" }}
                    >
                        Today
                    </Button>
                    <Button
                        size="small"
                        variant={datePreset === "THIS_MONTH" ? "contained" : "outlined"}
                        onClick={() => applyDatePreset("THIS_MONTH")}
                        sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem" }}
                    >
                        This Month
                    </Button>
                    <Button
                        size="small"
                        variant={datePreset === "LAST_MONTH" ? "contained" : "outlined"}
                        onClick={() => applyDatePreset("LAST_MONTH")}
                        sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem" }}
                    >
                        Last Month
                    </Button>
                </Box>

                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 1, display: "block" }}>
                    Custom Date Range:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <TextField
                        size="small"
                        label="From"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setDatePreset("CUSTOM");
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <TextField
                        size="small"
                        label="To"
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setDatePreset("CUSTOM");
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                            setPage(1);
                            setDatePickerAnchor(null);
                        }}
                        sx={{ mt: 0.5, textTransform: "none" }}
                    >
                        Apply Filter
                    </Button>
                </Box>
            </Popover>

            {/* Table Container matching reference image styling */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "background.paper"
                }}
            >
                <Table sx={{ minWidth: 800 }} aria-label="Transaction Roster Table">
                    <TableHead>
                        <TableRow
                            sx={{
                                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f9fafb",
                                borderBottom: "1px solid",
                                borderColor: "divider"
                            }}
                        >
                            {/* 1. Date */}
                            <TableCell
                                onClick={() => handleSort("date")}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    width: "110px"
                                }}
                            >
                                <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                                    Date {renderSortIcon("date")}
                                </Box>
                            </TableCell>

                            {/* 2. Receiving Type */}
                            <TableCell
                                onClick={() => handleSort("type")}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    width: "190px"
                                }}
                            >
                                <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                                    Receiving Type {renderSortIcon("type")}
                                </Box>
                            </TableCell>

                            {/* 3. Accounts */}
                            <TableCell
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2,
                                    width: "160px"
                                }}
                            >
                                Accounts
                            </TableCell>

                            {/* 4. Description */}
                            <TableCell
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2
                                }}
                            >
                                Description
                            </TableCell>

                            {/* 5. Payment Method */}
                            <TableCell
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2,
                                    width: "150px"
                                }}
                            >
                                Payment Method
                            </TableCell>

                            {/* 6. Receiving Amount */}
                            <TableCell
                                align="right"
                                onClick={() => handleSort("amount")}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    py: 1.5,
                                    px: 2.5,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    width: "170px"
                                }}
                            >
                                <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
                                    Receiving Amount {renderSortIcon("amount")}
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading && transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={30} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Loading receiving transactions...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                        No receiving transactions found
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        Try modifying your search or date filter.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx, idx) => (
                                <TableRow
                                    key={tx.id || idx}
                                    sx={{
                                        "&:hover": {
                                            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#f8fafc"
                                        },
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        transition: "background-color 0.15s ease"
                                    }}
                                >
                                    {/* 1. Date */}
                                    <TableCell
                                        sx={{
                                            py: 1.25,
                                            px: 2,
                                            fontSize: "0.88rem",
                                            color: "text.primary",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {tx.formattedDate}
                                    </TableCell>

                                    {/* 2. Receiving Type */}
                                    <TableCell
                                        sx={{
                                            py: 1.25,
                                            px: 2,
                                            fontSize: "0.88rem",
                                            color: "text.primary"
                                        }}
                                    >
                                        {tx.receivingType}
                                    </TableCell>

                                    {/* 3. Accounts */}
                                    <TableCell sx={{ py: 1.25, px: 2 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: "text.primary",
                                                lineHeight: 1.2,
                                                fontSize: "0.88rem"
                                            }}
                                        >
                                            {tx.accountName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "text.secondary",
                                                display: "block",
                                                lineHeight: 1.3,
                                                fontSize: "0.75rem",
                                                mt: 0.2
                                            }}
                                        >
                                            {tx.accountOver}
                                        </Typography>
                                    </TableCell>

                                    {/* 4. Description */}
                                    <TableCell
                                        sx={{
                                            py: 1.25,
                                            px: 2,
                                            fontSize: "0.86rem",
                                            color: "text.primary"
                                        }}
                                    >
                                        {tx.description}
                                    </TableCell>

                                    {/* 5. Payment Method */}
                                    <TableCell
                                        sx={{
                                            py: 1.25,
                                            px: 2,
                                            fontSize: "0.88rem",
                                            color: "text.primary"
                                        }}
                                    >
                                        {tx.paymentMethod}
                                    </TableCell>

                                    {/* 6. Receiving Amount */}
                                    <TableCell
                                        align="right"
                                        sx={{
                                            py: 1.25,
                                            px: 2.5,
                                            fontSize: "0.92rem",
                                            fontWeight: 600,
                                            color: "text.primary",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {tx.amountDisplay}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer Section matching reference image: Showing 1-12 of 45 and Prev 1 2 3 Next */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                    px: 0.5,
                    flexWrap: "wrap",
                    gap: 1.5
                }}
            >
                {/* Showing Range */}
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

                {/* Pagination Controls */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
                            py: 0.5,
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
                                color: pageNum === page ? "primary.contrastText" : "text.secondary",
                                bgcolor: pageNum === page ? "primary.main" : "transparent",
                                "&:hover": {
                                    bgcolor: pageNum === page ? "primary.dark" : "action.hover",
                                    color: pageNum === page ? "primary.contrastText" : "text.primary"
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
                            py: 0.5,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            {/* Total Receiving Summary Card */}
            <Grid container spacing={2} sx={{ mt: 2.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: theme.palette.mode === "dark"
                                ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))"
                                : "linear-gradient(135deg, #10B98111, #05966911)",
                            border: "1px solid",
                            borderColor: theme.palette.mode === "dark" ? "rgba(16,185,129,0.25)" : "#10B98133",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: theme.palette.mode === "dark"
                                    ? "0 4px 20px rgba(16,185,129,0.15)"
                                    : "0 4px 20px rgba(16,185,129,0.12)"
                            }
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: theme.palette.mode === "dark" ? "rgba(16,185,129,0.18)" : "#10B98118",
                                }}
                            >
                                <TrendingUp size={20} color="#10B981" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: "0.02em" }}>
                                    Total Receiving
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#10B981", mt: 0.25, lineHeight: 1.2 }}>
                                    Rs. {totalReceivedSum.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                                    {totalCount} transaction{totalCount !== 1 ? "s" : ""}
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
