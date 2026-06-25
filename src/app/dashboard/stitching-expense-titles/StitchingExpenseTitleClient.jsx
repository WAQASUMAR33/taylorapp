"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Box,
    Typography,
    TextField,
    Grid,
    Alert,
    Snackbar,
    Chip,
    Card,
    Avatar,
    InputAdornment,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { Search, Plus, Edit, Trash2, Save, X as XIcon, Tags, Receipt } from "lucide-react";

export default function StitchingExpenseTitleClient({ initialTitles }) {
    const [titles, setTitles] = useState(initialTitles);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingTitle, setEditingTitle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [titleName, setTitleName] = useState("");

    /* ── handlers ───────────────────────────────────── */

    const handleOpen = (title = null) => {
        setEditingTitle(title);
        setTitleName(title ? title.name : "");
        setError("");
        setShowForm(true);
    };

    const handleClose = () => {
        setShowForm(false);
        setEditingTitle(null);
        setTitleName("");
        setError("");
    };

    const handleSubmit = async () => {
        if (!titleName.trim()) {
            setError("Title name is required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const method = editingTitle ? "PUT" : "POST";
            const payload = editingTitle
                ? { id: editingTitle.id, name: titleName }
                : { name: titleName };

            const res = await fetch("/api/stitching-expense-titles", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save title");
            }

            const refreshRes = await fetch("/api/stitching-expense-titles");
            const refreshed = await refreshRes.json();
            setTitles(refreshed);

            setSuccessMessage(editingTitle ? "Title updated!" : "Title created!");
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, expenseCount) => {
        if (expenseCount > 0) {
            setError(`Cannot delete — ${expenseCount} expense(s) are using this title.`);
            return;
        }
        if (!confirm("Are you sure you want to delete this title?")) return;
        try {
            const res = await fetch(`/api/stitching-expense-titles?id=${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            setTitles(prev => prev.filter(t => t.id !== id));
            setSuccessMessage("Title deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    /* ── derived ──────────────────────────────────── */

    const filtered = (titles || []).filter(t =>
        (t.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    );
    const totalExpenses = titles.reduce((s, t) => s + (t._count?.expenses || 0), 0);

    /* ── render ──────────────────────────────────── */

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {error && (
                <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* ── Stats Cards ──────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                        color: "white",
                        borderRadius: 3,
                        boxShadow: "0 10px 40px rgba(99,102,241,0.3)",
                    }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                    Total Titles
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                    {titles.length}
                                </Typography>
                            </Box>
                            <Tags size={36} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                        color: "white",
                        borderRadius: 3,
                        boxShadow: "0 10px 40px rgba(14,165,233,0.3)",
                    }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                    Total Expenses
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                    {totalExpenses}
                                </Typography>
                            </Box>
                            <Receipt size={36} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Action Bar ────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search titles…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => handleOpen()}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        background: "linear-gradient(135deg, #2563EB, #4F46E5)",
                        boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                    }}
                >
                    Add Title
                </Button>
            </Box>

            {/* ── Titles Table ───────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <Table sx={{ minWidth: 500 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Title Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Expenses</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length > 0 ? (
                            filtered.map((title) => {
                                const count = title._count?.expenses || 0;
                                return (
                                    <TableRow
                                        key={title.id}
                                        sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={(t) => ({
                                                        width: 32, height: 32, fontSize: "0.8rem", fontWeight: 700,
                                                        bgcolor: t.palette.primary.light,
                                                        color: t.palette.primary.main,
                                                        borderRadius: 1,
                                                    })}
                                                >
                                                    {(title.name || "?")[0].toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {title.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Receipt size={13} />}
                                                label={count}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ borderRadius: 1, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={title.isActive !== false ? "Active" : "Inactive"}
                                                size="small"
                                                color={title.isActive !== false ? "success" : "default"}
                                                variant="filled"
                                                sx={{ borderRadius: 1, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                                <Tooltip title="Edit Title">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpen(title)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={count > 0 ? "Cannot delete — expenses exist" : "Delete Title"}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(title.id, count)}
                                                            disabled={count > 0}
                                                        >
                                                            <Trash2 size={17} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Tags size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                        No titles found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* ── Add / Edit Dialog ──────────────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {editingTitle ? "Edit Title" : "New Title"}
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        size="small"
                        label="Title Name"
                        placeholder="e.g. Thread, Buttons, Lining…"
                        required
                        autoFocus
                        value={titleName}
                        onChange={(e) => setTitleName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && titleName.trim()) handleSubmit(); }}
                        variant="outlined"
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !titleName.trim()}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3,
                            background: "linear-gradient(135deg, #2563EB, #4F46E5)",
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : (editingTitle ? "Update" : "Save")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ────────────────────────── */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
