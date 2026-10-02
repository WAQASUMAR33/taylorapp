"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";
import {
    Box,
    Button,
    Card,
    Grid,
    Typography,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    FormControlLabel,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Avatar,
    Divider,
} from "@mui/material";
import {
    Store,
    Plus,
    Search,
    Edit,
    Trash2,
    Phone,
    MapPin,
    Sparkles,
    FileText,
    Users,
    Calendar,
    Upload,
    X,
    CheckCircle2,
    Building2,
    Check,
} from "lucide-react";

export default function BranchManagementClient({ initialBranches }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const canManage = isAdmin || checkPermission(session, "branches", "create") || checkPermission(session, "branches", "edit");
    const canDelete = isAdmin || checkPermission(session, "branches", "delete");

    const [branches, setBranches] = useState(initialBranches || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        phone: "",
        address: "",
        slogan: "",
        logo: "",
        notes: "",
        isActive: true,
    });

    const refreshBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
            }
        } catch (err) {
            console.error("Failed to refresh branches:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingBranch(null);
        setFormData({
            name: "",
            code: "",
            phone: "",
            address: "",
            slogan: "",
            logo: "/logo.png",
            notes: "",
            isActive: true,
        });
        setError("");
        setDialogOpen(true);
    };

    const handleOpenEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name || "",
            code: branch.code || "",
            phone: branch.phone || "",
            address: branch.address || "",
            slogan: branch.slogan || "",
            logo: branch.logo || "",
            notes: branch.notes || "",
            isActive: branch.isActive !== undefined ? branch.isActive : true,
        });
        setError("");
        setDialogOpen(true);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        setError("");
        try {
            const form = new FormData();
            form.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload logo image");
            }

            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, logo: data.url }));
                setSuccessMessage("Branch logo uploaded successfully!");
            }
        } catch (err) {
            setError(err.message || "Failed to upload logo");
        } finally {
            setUploadingLogo(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.name.trim()) {
            setError("Branch name is required.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const url = editingBranch ? `/api/branches/${editingBranch.id}` : "/api/branches";
            const method = editingBranch ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to save branch");
            }

            setSuccessMessage(editingBranch ? "Branch updated successfully!" : "Branch created successfully!");
            setDialogOpen(false);
            await refreshBranches();
        } catch (err) {
            setError(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (branch) => {
        const hasRecords = (branch._count?.users || 0) + (branch._count?.bookings || 0) > 0;
        const confirmMsg = hasRecords
            ? `Branch "${branch.name}" has linked records and will be DEACTIVATED instead of deleted. Continue?`
            : `Are you sure you want to delete branch "${branch.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete branch");
            }
            setSuccessMessage(data.message || "Branch updated successfully!");
            await refreshBranches();
        } catch (err) {
            setError(err.message || "Failed to delete branch");
        }
    };

    // Filter branches
    const filteredBranches = branches.filter(b => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (b.name && b.name.toLowerCase().includes(q)) ||
               (b.code && b.code.toLowerCase().includes(q)) ||
               (b.phone && b.phone.toLowerCase().includes(q)) ||
               (b.address && b.address.toLowerCase().includes(q)) ||
               (b.slogan && b.slogan.toLowerCase().includes(q));
    });

    // Summary statistics
    const totalBranches = branches.length;
    const activeBranches = branches.filter(b => b.isActive).length;
    const totalUsers = branches.reduce((sum, b) => sum + (b._count?.users || 0), 0);
    const totalBookings = branches.reduce((sum, b) => sum + (b._count?.bookings || 0), 0);

    return (
        <Box sx={{ width: "100%", p: 3 }}>
            {/* ── Summary Cards ────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    {
                        label: "Total Branches",
                        value: totalBranches,
                        gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        shadow: "rgba(99, 102, 241, 0.3)",
                        icon: <Building2 size={30} style={{ opacity: 0.85 }} />,
                    },
                    {
                        label: "Active Branches",
                        value: activeBranches,
                        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        shadow: "rgba(16, 185, 129, 0.3)",
                        icon: <CheckCircle2 size={30} style={{ opacity: 0.85 }} />,
                    },
                    {
                        label: "Staff Across Branches",
                        value: totalUsers,
                        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        shadow: "rgba(59, 130, 246, 0.3)",
                        icon: <Users size={30} style={{ opacity: 0.85 }} />,
                    },
                    {
                        label: "Central Bookings Recorded",
                        value: totalBookings,
                        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        shadow: "rgba(139, 92, 246, 0.3)",
                        icon: <Calendar size={30} style={{ opacity: 0.85 }} />,
                    },
                ].map(({ label, value, gradient, shadow, icon }) => (
                    <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{
                            p: 2.5,
                            background: gradient,
                            color: "white",
                            borderRadius: 3,
                            boxShadow: `0 8px 24px ${shadow}`,
                        }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600, fontSize: "0.85rem" }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                                        {value}
                                    </Typography>
                                </Box>
                                {icon}
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Action & Filter Bar ─────────────────────── */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                        size="small"
                        placeholder="Search branches by name, code, phone, address…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 320, flex: { xs: 1, md: "none" } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color="#6b7280" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {canManage && (
                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={handleOpenCreate}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 700,
                                px: 3,
                                py: 0.9,
                                background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                            }}
                        >
                            Add New Branch
                        </Button>
                    )}
                </Box>
            </Card>

            {/* ── Branches Table ─────────────────────────── */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Branch & Branding</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Contact & Address</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Slogan & Notes</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>Staff</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>Bookings</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBranches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                        <Store size={40} color="#94a3b8" />
                                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                            No branches found matching your search.
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBranches.map((b) => (
                                <TableRow key={b.id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                                    {/* Branch & Logo */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                            <Avatar
                                                src={b.logo || "/logo.png"}
                                                alt={b.name}
                                                variant="rounded"
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    bgcolor: "#e0e7ff",
                                                    border: "1px solid #e2e8f0",
                                                    p: 0.5,
                                                    "& img": { objectFit: "contain" }
                                                }}
                                            >
                                                <Store size={22} color="#4f46e5" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                    {b.name}
                                                </Typography>
                                                {b.code === "MAIN" && (
                                                    <Chip
                                                        label="Head Office"
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ height: 19, fontSize: "0.68rem", fontWeight: 700, mt: 0.3 }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Code */}
                                    <TableCell>
                                        <Chip
                                            label={b.code || `BR-${b.id}`}
                                            size="small"
                                            sx={{ fontWeight: 700, bgcolor: "#f1f5f9", color: "#334155" }}
                                        />
                                    </TableCell>

                                    {/* Contact & Address */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                            {b.phone ? (
                                                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#1e293b", fontWeight: 600 }}>
                                                    <Phone size={13} color="#4f46e5" />
                                                    {b.phone}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">No phone</Typography>
                                            )}
                                            {b.address && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <MapPin size={13} color="#94a3b8" />
                                                    {b.address}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    {/* Slogan & Notes */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxWidth: 220 }}>
                                            {b.slogan ? (
                                                <Typography variant="caption" sx={{ fontStyle: "italic", color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <Sparkles size={12} color="#f59e0b" />
                                                    "{b.slogan}"
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                            {b.notes && (
                                                <Typography variant="caption" color="text.secondary" noWrap title={b.notes}>
                                                    {b.notes}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    {/* Users count */}
                                    <TableCell align="center">
                                        <Chip
                                            icon={<Users size={13} />}
                                            label={b._count?.users || 0}
                                            size="small"
                                            sx={{ fontWeight: 600, bgcolor: "#eff6ff", color: "#2563eb" }}
                                        />
                                    </TableCell>

                                    {/* Bookings count */}
                                    <TableCell align="center">
                                        <Chip
                                            icon={<Calendar size={13} />}
                                            label={b._count?.bookings || 0}
                                            size="small"
                                            sx={{ fontWeight: 600, bgcolor: "#f5f3ff", color: "#7c3aed" }}
                                        />
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell align="center">
                                        <Chip
                                            label={b.isActive ? "Active" : "Inactive"}
                                            size="small"
                                            color={b.isActive ? "success" : "default"}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                            {canManage && (
                                                <Tooltip title="Edit Branch Branding">
                                                    <IconButton size="small" onClick={() => handleOpenEdit(b)} sx={{ color: "#3b82f6" }}>
                                                        <Edit size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {canDelete && b.code !== "MAIN" && (
                                                <Tooltip title="Delete or Deactivate Branch">
                                                    <IconButton size="small" onClick={() => handleDelete(b)} sx={{ color: "#ef4444" }}>
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Create / Edit Branch Modal ─────────────────── */}
            <Dialog
                open={dialogOpen}
                onClose={() => !saving && setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Store size={22} color="#4f46e5" />
                            <Typography variant="h6" fontWeight="bold">
                                {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create New Branch"}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={saving}>
                            <X size={18} />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2.5}>
                        {/* ── Logo Branding Section ── */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: "1px solid #e2e8f0",
                                bgcolor: "#f8fafc",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                flexWrap: "wrap",
                            }}>
                                <Avatar
                                    src={formData.logo || "/logo.png"}
                                    alt="Branch Logo"
                                    variant="rounded"
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        bgcolor: "#ffffff",
                                        border: "2px solid #cbd5e1",
                                        p: 1,
                                        "& img": { objectFit: "contain" }
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                                        Branch Logo (Used for Receipts & Branding)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        Upload branch logo image (PNG, JPG, WebP) or enter an existing URL.
                                    </Typography>

                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            onChange={handleLogoUpload}
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={uploadingLogo ? <CircularProgress size={16} /> : <Upload size={15} />}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingLogo || saving}
                                            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                                        >
                                            {uploadingLogo ? "Uploading…" : "Upload Logo"}
                                        </Button>
                                        {formData.logo && (
                                            <Button
                                                size="small"
                                                color="inherit"
                                                onClick={() => setFormData(p => ({ ...p, logo: "" }))}
                                                sx={{ textTransform: "none", fontSize: "0.8rem" }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* ── Basic Info ── */}
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Name"
                                required
                                placeholder="e.g. Dinga Main Branch, Phalia Branch"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Code"
                                placeholder="e.g. DNG, PHL"
                                value={formData.code}
                                onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            />
                        </Grid>

                        {/* ── Branding Details: Slogan & Phones ── */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Slogan (Appears on Receipts)"
                                placeholder="e.g. Where Style Meets Perfection"
                                value={formData.slogan}
                                onChange={(e) => setFormData(p => ({ ...p, slogan: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Sparkles size={16} color="#f59e0b" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Contact Phone(s)"
                                placeholder="e.g. 03006284318 | 03186284318"
                                value={formData.phone}
                                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone size={16} color="#6b7280" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* ── Address ── */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Physical Address (Printed on Bill & Receipts)"
                                placeholder="e.g. Basement of Faazal Plaza, Dhulyan Chowk Dinga"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                                            <MapPin size={16} color="#6b7280" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* ── Notes / Remarks ── */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Branch Notes / Terms"
                                placeholder="Internal remarks, working hours, or special invoice footer notes…"
                                multiline
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                            />
                        </Grid>

                        {/* ── Status Switch ── */}
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                                        color="success"
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight={600}>
                                        Branch is Active & Accepting Orders
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        variant="outlined"
                        color="inherit"
                        disabled={saving}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !formData.name.trim()}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            px: 3,
                            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                        }}
                    >
                        {saving ? "Saving…" : editingBranch ? "Update Branch" : "Create Branch"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Feedback Snackbar ────────────────── */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" variant="filled" sx={{ borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
