"use client";

import React, { useState } from "react";
import {
    Box, Button, Card, Typography, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Chip, Alert, Snackbar, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, InputAdornment, Tooltip
} from "@mui/material";
import { Plus, Trash2, Pencil, Scissors, Save, X as XIcon } from "lucide-react";

const FIELD_SX = {
    "& .MuiOutlinedInput-root": {
        bgcolor: "white", borderRadius: 2,
        "& fieldset": { borderColor: "#e5e7eb" },
        "&:hover fieldset": { borderColor: "#8b5cf6" },
        "&.Mui-focused fieldset": { borderColor: "#8b5cf6", borderWidth: 2 },
    }
};

export default function StitchingOptionsClient({ initialOptions }) {
    const [options, setOptions] = useState(initialOptions || []);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null); // null = new, object = edit
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");

    const openNewDialog = () => {
        setEditingOption(null);
        setFormName("");
        setFormPrice("");
        setError("");
        setDialogOpen(true);
    };

    const openEditDialog = (opt) => {
        setEditingOption(opt);
        setFormName(opt.name);
        setFormPrice(String(parseFloat(opt.price)));
        setError("");
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setFormName("");
        setFormPrice("");
        setError("");
    };

    const handleSave = async () => {
        if (!formName.trim()) { setError("Name is required"); return; }
        if (formPrice === "" || isNaN(parseFloat(formPrice)) || parseFloat(formPrice) < 0) {
            setError("A valid price is required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const isEdit = !!editingOption;
            const res = await fetch("/api/stitching-options", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isEdit
                        ? { id: editingOption.id, name: formName, price: parseFloat(formPrice) }
                        : { name: formName, price: parseFloat(formPrice) }
                )
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to save");
            }
            // Refresh list
            const refreshRes = await fetch("/api/stitching-options");
            const refreshed = await refreshRes.json();
            setOptions(Array.isArray(refreshed) ? refreshed : []);
            setSuccessMessage(isEdit ? "Option updated!" : "Option added!");
            closeDialog();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this stitching option?")) return;
        try {
            const res = await fetch(`/api/stitching-options?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setOptions(prev => prev.filter(o => o.id !== id));
            setSuccessMessage("Option deleted!");
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Box>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Add button */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={openNewDialog}
                    sx={{
                        borderRadius: 2, textTransform: "none", px: 3,
                        background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                        boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
                        "&:hover": { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }
                    }}
                >
                    Add Option
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Card} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Option Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }} align="right">Price (Rs.)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {options.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "#9ca3af" }}>
                                    <Scissors size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                    <Typography variant="body2">No stitching options yet. Add your first one.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            options.map((opt, idx) => (
                                <TableRow key={opt.id} sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                                    <TableCell sx={{ color: "#6b7280", fontWeight: 600 }}>{idx + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`Rs. ${parseFloat(opt.price).toLocaleString()}`}
                                            size="small"
                                            sx={{ bgcolor: "#f0fdf4", color: "#059669", fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEditDialog(opt)} sx={{ color: "#8b5cf6" }}>
                                                    <Pencil size={15} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(opt.id)}>
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

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{
                    fontWeight: 700, borderBottom: "1px solid", borderColor: "divider",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Scissors size={18} color="#8b5cf6" />
                        {editingOption ? "Edit Option" : "Add Stitching Option"}
                    </Box>
                    <IconButton size="small" onClick={closeDialog}><XIcon size={18} /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: "20px !important" }}>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Option Name"
                            placeholder="e.g. Single Silai, Double Silai"
                            fullWidth
                            size="small"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            sx={FIELD_SX}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <TextField
                            label="Price"
                            placeholder="0"
                            fullWidth
                            size="small"
                            type="number"
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            sx={FIELD_SX}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button variant="outlined" onClick={closeDialog} disabled={loading}
                        sx={{ borderRadius: 2, textTransform: "none", borderColor: "#d1d5db", color: "#374151" }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                        sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}>
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
