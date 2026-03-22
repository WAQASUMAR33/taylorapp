"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
} from "@mui/material";
import { AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";

export default function SettingsClient() {
    const [resetOpen, setResetOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleReset = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/reset-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed.");
            setSuccess("All data has been reset successfully. User accounts have been preserved.");
            setResetOpen(false);
            setPassword("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setResetOpen(false);
        setPassword("");
        setError("");
    };

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* Page header */}
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Manage system configuration and data.
            </Typography>

            {success && (
                <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3, borderRadius: 2, maxWidth: 680 }}>
                    {success}
                </Alert>
            )}

            {/* Danger Zone card */}
            <Card
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "error.light",
                    borderRadius: 3,
                    maxWidth: 680,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <Typography variant="subtitle1" fontWeight={700} color="error.main">
                            Danger Zone
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 2,
                            border: "1px solid",
                            borderColor: "error.light",
                            borderRadius: 2,
                            bgcolor: "rgba(239,68,68,0.03)",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                Reset All Data
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                                Permanently deletes all customers, bookings, orders, products, employees,
                                materials, purchases, ledger entries, and financial records.
                                User accounts are preserved.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<RotateCcw size={15} />}
                            onClick={() => setResetOpen(true)}
                            sx={{ borderRadius: 2, textTransform: "none", whiteSpace: "nowrap", flexShrink: 0 }}
                        >
                            Reset Data
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <Dialog
                open={resetOpen}
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        pb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <ShieldAlert size={20} color="#ef4444" />
                    Confirm Data Reset
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: "0.82rem" }}>
                        This will <strong>permanently delete all business data</strong>. This action cannot be undone.
                    </Alert>

                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        label="Enter password to confirm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter" && password && !loading) handleReset(); }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReset}
                        disabled={loading || !password.trim()}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Reset All Data"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
