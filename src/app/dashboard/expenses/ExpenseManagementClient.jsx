"use client";

import { useState, useMemo } from "react";
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
} from "@mui/material";
import { Pencil, Trash2, Search, Plus, X, Save, Receipt } from "lucide-react";

const emptyForm = {
    title: "",
    date: "",
    amount: "",
    description: "",
};

export default function ExpenseManagementClient({ initialExpenses }) {
    const [expenses, setExpenses] = useState(initialExpenses);

    // Filters
    const [filterTitle, setFilterTitle] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");

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
                e.title.toLowerCase().includes(filterTitle.toLowerCase());

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

    function openCreate() {
        setEditingId(null);
        setFormData(emptyForm);
        setError("");
        setShowForm(true);
    }

    function openEdit(expense) {
        setEditingId(expense.id);
        setFormData({
            title: expense.title,
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
        if (!formData.title.trim() || !formData.date || !formData.amount) {
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
                ? `/api/expenses/${editingId}`
                : "/api/expenses";
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
                setSuccessMessage("Expense updated successfully.");
            } else {
                setExpenses((prev) => [data, ...prev]);
                setSuccessMessage("Expense added successfully.");
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
            const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete expense");
            }
            setExpenses((prev) => prev.filter((e) => e.id !== id));
            setSuccessMessage("Expense deleted successfully.");
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

    const hasFilters = filterTitle || filterDateFrom || filterDateTo;

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
                    Add Expense
                </Button>
            </Box>

            {/* Summary card */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #2563EB11, #4F46E511)",
                            border: "1px solid",
                            borderColor: "primary.light",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {hasFilters ? "Filtered Total" : "Total Expenses"}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>
                            PKR {totalFiltered.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </Typography>
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
                                            <Typography variant="body2">No expenses found</Typography>
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
                                                {expense.title}
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
                    {editingId ? "Edit Expense" : "Add Expense"}
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
                                label="Title"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, title: e.target.value }))
                                }
                            />
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
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Expense</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this expense? This action cannot be undone.
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
