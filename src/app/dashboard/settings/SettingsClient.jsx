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
    Checkbox,
    FormGroup,
    Grid,
    Divider,
} from "@mui/material";
import { AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";

const DB_TABLE_GROUPS = [
    {
        title: "Transactional & Financial Data",
        description: "Business activity, sales, ledger entries, and stitching process details.",
        tables: [
            { id: "booking", label: "Bookings", description: "All bookings, item details, tailor/cutter assignments", tables: ["booking", "booking_item", "booking_staff", "booking_item_stitching_option"] },
            { id: "order", label: "Stitching Orders", description: "Orders assigned to stitching employees", tables: ["order"] },
            { id: "ledgerentry", label: "Ledger Entries", description: "Financial ledger entries for customer accounts", tables: ["ledgerentry"] },
            { id: "bill", label: "Bills & Invoices", description: "Invoiced billing details for customers", tables: ["bill", "bill_item"] },
            { id: "purchase", label: "Purchases & Payments", description: "Supplier purchases, items, and bank payment history", tables: ["purchase", "purchase_item", "purchase_payment"] },
            { id: "expense", label: "Expenses", description: "General office and business expense records", tables: ["expense"] },
            { id: "stockmovement", label: "Stock Movements", description: "Historical log of product inventory changes", tables: ["stockmovement"] },
            { id: "materialmovement", label: "Material Movements", description: "Historical log of fabric/material usage", tables: ["materialmovement"] },
        ]
    },
    {
        title: "Master Data & Setup",
        description: "Customers, product catalog, materials, and system configuration.",
        tables: [
            { id: "customer", label: "Customers", description: "Client profiles and contact directory", tables: ["customer"] },
            { id: "measurement", label: "Measurements", description: "Customer body sizing records and notes", tables: ["measurement"] },
            { id: "product", label: "Products", description: "Stitched garments, fabrics, and pricing records", tables: ["product"] },
            { id: "category", label: "Product Categories", description: "Garment categories (e.g. Suit, Waistcoat)", tables: ["category"] },
            { id: "material", label: "Materials", description: "Stock inventory of fabric and stitching materials", tables: ["material"] },
            { id: "bank", label: "Banks", description: "Bank accounts and payment methods setup", tables: ["bank"] },
            { id: "employee", label: "Employees", description: "Staff profiles, tailors, cutters, and salaries", tables: ["employee"] },
            { id: "accountcategory", label: "Account Categories", description: "Customer ledger category types", tables: ["accountcategory"] },
            { id: "stitching_option", label: "Stitching Options", description: "Custom stitching add-ons and costs setup", tables: ["stitching_option"] },
        ]
    }
];

export default function SettingsClient() {
    const [resetOpen, setResetOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedEntities, setSelectedEntities] = useState({});

    const handleToggleEntity = (id) => {
        setSelectedEntities(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSelectAll = () => {
        const next = {};
        DB_TABLE_GROUPS.forEach(group => {
            group.tables.forEach(t => {
                next[t.id] = true;
            });
        });
        setSelectedEntities(next);
    };

    const handleClearAll = () => {
        setSelectedEntities({});
    };

    const handleSelectTransactions = () => {
        const next = {};
        DB_TABLE_GROUPS[0].tables.forEach(t => {
            next[t.id] = true;
        });
        DB_TABLE_GROUPS[1].tables.forEach(t => {
            next[t.id] = false;
        });
        setSelectedEntities(next);
    };

    const handleSelectMasterData = () => {
        const next = {};
        DB_TABLE_GROUPS[0].tables.forEach(t => {
            next[t.id] = false;
        });
        DB_TABLE_GROUPS[1].tables.forEach(t => {
            next[t.id] = true;
        });
        setSelectedEntities(next);
    };

    const getTablesToReset = () => {
        const tables = [];
        DB_TABLE_GROUPS.forEach(group => {
            group.tables.forEach(entity => {
                if (selectedEntities[entity.id]) {
                    tables.push(...entity.tables);
                }
            });
        });
        return tables;
    };

    const handleReset = async () => {
        setLoading(true);
        setError("");
        try {
            const tables = getTablesToReset();
            const res = await fetch("/api/reset-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, tables }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed.");

            const selectedCount = Object.values(selectedEntities).filter(Boolean).length;
            const totalCount = DB_TABLE_GROUPS.flatMap(g => g.tables).length;
            if (selectedCount === totalCount) {
                setSuccess("All data has been reset successfully. User accounts have been preserved.");
            } else {
                setSuccess("Selected data has been reset successfully.");
            }

            setResetOpen(false);
            setPassword("");
            setSelectedEntities({});
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

    const selectedLabels = DB_TABLE_GROUPS.flatMap(g => g.tables)
        .filter(t => selectedEntities[t.id])
        .map(t => t.label);

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
                <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3, borderRadius: 2, maxWidth: 900 }}>
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
                    maxWidth: 900,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <Typography variant="subtitle1" fontWeight={700} color="error.main">
                            Danger Zone: Selective Database Reset
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select the specific tables/data groups you want to delete. Bypassing foreign key constraints is handled automatically, but deleting master data (like customers or products) while keeping transaction history (like bookings or bills) may result in orphaned records.
                    </Typography>

                    {/* Helper buttons */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3.5 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSelectAll}
                            sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSelectTransactions}
                            sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                        >
                            Select Transactions Only
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSelectMasterData}
                            sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                        >
                            Select Master Data Only
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleClearAll}
                            sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                        >
                            Clear Selection
                        </Button>
                    </Box>

                    <Grid container spacing={4}>
                        {DB_TABLE_GROUPS.map((group, groupIdx) => (
                            <Grid item xs={12} md={6} key={groupIdx}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                                    {group.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    {group.description}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <FormGroup>
                                    {group.tables.map((table) => {
                                        const isChecked = !!selectedEntities[table.id];
                                        return (
                                            <Box
                                                key={table.id}
                                                onClick={() => handleToggleEntity(table.id)}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    p: 1.5,
                                                    mb: 1,
                                                    borderRadius: 2,
                                                    border: "1px solid",
                                                    borderColor: isChecked ? "error.light" : "transparent",
                                                    bgcolor: isChecked ? "rgba(239, 68, 68, 0.03)" : "transparent",
                                                    transition: "all 0.2s",
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        bgcolor: isChecked ? "rgba(239, 68, 68, 0.05)" : "action.hover",
                                                        borderColor: isChecked ? "error.main" : "divider"
                                                    }
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleEntity(table.id);
                                                    }}
                                                    color="error"
                                                    size="small"
                                                    sx={{ p: 0.5, mt: -0.2 }}
                                                />
                                                <Box sx={{ ml: 1 }}>
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                                        {table.label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.2 }}>
                                                        {table.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </FormGroup>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={!Object.values(selectedEntities).some(Boolean)}
                            startIcon={<RotateCcw size={16} />}
                            onClick={() => setResetOpen(true)}
                            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                        >
                            Reset Selected Data
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
                        This will <strong>permanently delete</strong> the following selected business data. This action cannot be undone.
                    </Alert>

                    <Box sx={{ mb: 2.5, p: 2, bgcolor: "action.hover", borderRadius: 2, maxHeight: 150, overflowY: "auto", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1, textTransform: "uppercase" }}>
                            Selected for Deletion:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {selectedLabels.map(label => (
                                <Box
                                    key={label}
                                    sx={{
                                        px: 1.5,
                                        py: 0.5,
                                        bgcolor: "error.light",
                                        color: "error.contrastText",
                                        borderRadius: 1.5,
                                        fontSize: "0.75rem",
                                        fontWeight: 600
                                    }}
                                >
                                    {label}
                                </Box>
                            ))}
                        </Box>
                    </Box>

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
                        {loading ? <CircularProgress size={20} color="inherit" /> : `Reset (${selectedLabels.length}) Items`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
