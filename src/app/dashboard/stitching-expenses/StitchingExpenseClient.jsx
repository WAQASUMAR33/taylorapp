"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    IconButton,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    Chip,
    MenuItem,
} from "@mui/material";
import { Pencil, Trash2, Search, Plus, X, Save, Receipt, TrendingUp, TrendingDown, Activity } from "lucide-react";

const emptyForm = {
    titleId: "",
    date: "",
    amount: "",
    description: "",
};

export default function StitchingExpenseClient({ initialExpenses, expenseTitles }) {
    const [expenses, setExpenses] = useState(initialExpenses);

    // Filters
    const [filterTitle, setFilterTitle] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");

    // Analytics state
    const [analytics, setAnalytics] = useState({
        totalStitchingAmount: 0,
        totalStitchingExpenses: 0,
        profit: 0,
    });
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchAnalytics() {
            setAnalyticsLoading(true);
            try {
                const params = new URLSearchParams();
                if (filterDateFrom) params.append("dateFrom", filterDateFrom);
                if (filterDateTo) params.append("dateTo", filterDateTo);

                const res = await fetch(`/api/stitching-expenses/analytics?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch analytics");
                const data = await res.json();
                if (isMounted) {
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Error fetching stitching expenses analytics:", err);
            } finally {
                if (isMounted) {
                    setAnalyticsLoading(false);
                }
            }
        }
        fetchAnalytics();
        return () => {
            isMounted = false;
        };
    }, [filterDateFrom, filterDateTo, expenses]);

    // Dialog
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Filtered list
    const filtered = useMemo(() => {
        return expenses.filter((e) => {
            const titleMatch =
                !filterTitle ||
                (e.title?.name || "").toLowerCase().includes(filterTitle.toLowerCase());

            const expDate = new Date(e.date);
            expDate.setHours(0, 0, 0, 0);

            let fromMatch = true;
            if (filterDateFrom) {
                const from = new Date(filterDateFrom);
                from.setHours(0, 0, 0, 0);
                fromMatch = expDate >= from;
            }

            let toMatch = true;
            if (filterDateTo) {
                const to = new Date(filterDateTo);
                to.setHours(23, 59, 59, 999);
                toMatch = expDate <= to;
            }

            return titleMatch && fromMatch && toMatch;
        });
    }, [expenses, filterTitle, filterDateFrom, filterDateTo]);

    const totalFiltered = useMemo(
        () => filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0),
        [filtered]
    );

    const hasFilters = filterTitle || filterDateFrom || filterDateTo;

    function openCreate() {
        setEditingId(null);
        setFormData(emptyForm);
        setError("");
        setShowForm(true);
    }

    function openEdit(expense) {
        setEditingId(expense.id);
        setFormData({
            titleId: expense.titleId,
            date: expense.date.slice(0, 10),
            amount: expense.amount,
            description: expense.description || "",
        });
        setError("");
        setShowForm(true);
    }

    function handleClose() {
        setShowForm(false);
        setEditingId(null);
        setError("");
    }

    async function handleSubmit() {
        if (!formData.titleId || !formData.date || !formData.amount) {
            setError("Title, date, and amount are required.");
            return;
        }
        if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            setError("Amount must be a positive number.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const url = editingId
                ? `/api/stitching-expenses/${editingId}`
                : "/api/stitching-expenses";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save expense");

            if (editingId) {
                setExpenses((prev) =>
                    prev.map((e) => (e.id === editingId ? data : e))
                );
                setSuccessMessage("Stitching expense updated successfully.");
            } else {
                setExpenses((prev) => [data, ...prev]);
                setSuccessMessage("Stitching expense added successfully.");
            }
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        setLoading(true);
        try {
            const res = await fetch(`/api/stitching-expenses/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete expense");
            }
            setExpenses((prev) => prev.filter((e) => e.id !== id));
            setSuccessMessage("Stitching expense deleted successfully.");
        } catch (err) {
            setSuccessMessage("");
            setError(err.message);
        } finally {
            setLoading(false);
            setDeleteConfirmId(null);
        }
    }

    function clearFilters() {
        setFilterTitle("");
        setFilterDateFrom("");
        setFilterDateTo("");
    }

    return (
        <Box sx={{ px: 3, pb: 4 }}>
            {/* Toolbar */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                    alignItems: "center",
                }}
            >
                <TextField
                    size="small"
                    placeholder="Search by title…"
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    sx={{ width: 240 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={16} />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    size="small"
                    label="Date From"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />
                <TextField
                    size="small"
                    label="Date To"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />
                {hasFilters && (
                    <Tooltip title="Clear filters">
                        <IconButton size="small" onClick={clearFilters}>
                            <X size={16} />
                        </IconButton>
                    </Tooltip>
                )}

                <Box sx={{ flexGrow: 1 }} />

                <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={openCreate}
                    sx={{
                        background: "linear-gradient(135deg, #2563EB, #4F46E5)",
                        boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                        textTransform: "none",
                        fontWeight: 600,
                    }}
                >
                    Add Stitching Expense
                </Button>
            </Box>

            {/* Summary cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Total Stitching Amount */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #10B98111, #05966911)",
                            border: "1px solid",
                            borderColor: "success.light",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Total Stitching Amount
                            </Typography>
                            {analyticsLoading ? (
                                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5, height: 32 }}>
                                    <CircularProgress size={20} />
                                </Box>
                            ) : (
                                <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                                    PKR {analytics.totalStitchingAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                Excludes product sales
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: "success.light",
                                borderRadius: 3,
                                color: "success.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <TrendingUp size={24} />
                        </Box>
                    </Card>
                </Grid>

                {/* Total Stitching Expenses */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #EF444411, #DC262611)",
                            border: "1px solid",
                            borderColor: "error.light",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Total Stitching Expenses
                            </Typography>
                            {analyticsLoading ? (
                                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5, height: 32 }}>
                                    <CircularProgress size={20} />
                                </Box>
                            ) : (
                                <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
                                    PKR {analytics.totalStitchingExpenses.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {filtered.length} record{filtered.length !== 1 ? "s" : ""} listed
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: "error.light",
                                borderRadius: 3,
                                color: "error.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <TrendingDown size={24} />
                        </Box>
                    </Card>
                </Grid>

                {/* Stitching Profit */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: analytics.profit >= 0 
                                ? "linear-gradient(135deg, #8B5CF611, #6366F111)" 
                                : "linear-gradient(135deg, #F59E0B11, #D9770611)",
                            border: "1px solid",
                            borderColor: analytics.profit >= 0 ? "primary.light" : "warning.light",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Net Stitching Profit
                            </Typography>
                            {analyticsLoading ? (
                                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5, height: 32 }}>
                                    <CircularProgress size={20} />
                                </Box>
                            ) : (
                                <Typography 
                                    variant="h5" 
                                    fontWeight={800} 
                                    color={analytics.profit >= 0 ? "primary.main" : "warning.main"} 
                                    sx={{ mt: 0.5 }}
                                >
                                    PKR {analytics.profit.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                Stitching Profit - Stitching Expenses
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: analytics.profit >= 0 ? "primary.light" : "warning.light",
                                borderRadius: 3,
                                color: analytics.profit >= 0 ? "primary.main" : "warning.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Activity size={24} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Table */}
            <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">
                                    Amount (PKR)
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Added By</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "text.disabled",
                                            }}
                                        >
                                            <Receipt size={40} />
                                            <Typography variant="body2">No stitching expenses found</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((expense, idx) => (
                                    <TableRow
                                        key={expense.id}
                                        hover
                                        sx={{ "&:last-child td": { border: 0 } }}
                                    >
                                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight={600} variant="body2">
                                                {expense.title?.name || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={new Date(expense.date).toLocaleDateString("en-PK", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: "0.75rem" }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={700} color="error.main">
                                                {parseFloat(expense.amount).toLocaleString("en-PK", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {expense.description || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {expense.addedByUser?.fullName || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openEdit(expense)}
                                                        sx={{ color: "primary.main" }}
                                                    >
                                                        <Pencil size={15} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDeleteConfirmId(expense.id)}
                                                        sx={{ color: "error.main" }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={showForm} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingId ? "Edit Stitching Expense" : "Add Stitching Expense"}
                </DialogTitle>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Expense Title"
                                select
                                fullWidth
                                required
                                value={formData.titleId}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, titleId: e.target.value }))
                                }
                            >
                                <MenuItem value="" disabled>
                                    Select a title…
                                </MenuItem>
                                {expenseTitles.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                required
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, date: e.target.value }))
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Amount (PKR)"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ min: 0, step: "0.01" }}
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, amount: e.target.value }))
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, description: e.target.value }))
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleClose}
                        startIcon={<X size={15} />}
                        color="inherit"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={
                            loading ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />
                        }
                        disabled={loading}
                        sx={{
                            background: "linear-gradient(135deg, #2563EB, #4F46E5)",
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        {loading ? "Saving…" : editingId ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={Boolean(deleteConfirmId)}
                onClose={() => setDeleteConfirmId(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Stitching Expense</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this stitching expense? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirmId(null)}
                        color="inherit"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(deleteConfirmId)}
                        disabled={loading}
                        startIcon={
                            loading ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={15} />
                        }
                    >
                        {loading ? "Deleting…" : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success snackbar */}
            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error snackbar */}
            <Snackbar
                open={Boolean(error) && !showForm}
                autoHideDuration={5000}
                onClose={() => setError("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setError("")}
                    severity="error"
                    sx={{ width: "100%" }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
