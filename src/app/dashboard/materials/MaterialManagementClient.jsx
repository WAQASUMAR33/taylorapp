"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";
import {
    Box,
    Button,
    IconButton,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Autocomplete,
    Avatar,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    Save,
    X as XIcon,
    Package,
    History,
    Eye,
    TrendingDown,
} from "lucide-react";

export default function MaterialManagementClient({ initialMaterials }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const canView = checkPermission(session, "materials", "view");
    const canCreate = checkPermission(session, "materials", "create");
    const canEdit = checkPermission(session, "materials", "edit");
    const canDelete = checkPermission(session, "materials", "delete");
    const [materials, setMaterials] = useState(initialMaterials);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog states
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [viewOpen, setViewOpen] = useState(false);
    const [stockDialogOpen, setStockDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    const [formData, setFormData] = useState({ title: "", quantity: "", price: "" });
    const [formError, setFormError] = useState("");

    const [stockFormData, setStockFormData] = useState({ materialId: "", addQuantity: "" });
    const [stockLoading, setStockLoading] = useState(false);
    const [stockError, setStockError] = useState("");

    // Out Stock dialog states
    const [outStockDialogOpen, setOutStockDialogOpen] = useState(false);
    const [outStockFormData, setOutStockFormData] = useState({ materialId: "", outQuantity: "", description: "" });
    const [outStockLoading, setOutStockLoading] = useState(false);
    const [outStockError, setOutStockError] = useState("");

    /* ── helpers ──────────────────────────────────────── */

    const normalizeMaterial = (m) => ({
        ...m,
        quantity: parseFloat(m.quantity),
        price: parseFloat(m.price),
    });

    const resetForm = () => {
        setFormData({ title: "", quantity: "", price: "" });
        setFormError("");
    };

    const resetStockForm = () => { setStockFormData({ materialId: "", addQuantity: "" }); setStockError(""); };
    const resetOutStockForm = () => { setOutStockFormData({ materialId: "", outQuantity: "", description: "" }); setOutStockError(""); };

    const currentMaterial = materials.find(
        (m) => m.id === parseInt(stockFormData.materialId)
    );

    const totalQty = (
        parseFloat(currentMaterial?.quantity || 0) +
        parseFloat(stockFormData.addQuantity || 0)
    ).toFixed(2);

    const outCurrentMaterial = materials.find(
        (m) => m.id === parseInt(outStockFormData.materialId)
    );

    const outTotalQty = (
        parseFloat(outCurrentMaterial?.quantity || 0) -
        parseFloat(outStockFormData.outQuantity || 0)
    ).toFixed(2);

    /* ── handlers ─────────────────────────────────────── */

    const handleOpen = () => { resetForm(); setShowForm(true); };

    const handleClose = () => { if (!loading) { setShowForm(false); resetForm(); } };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setFormError("");
        try {
            const isEditing = !!formData.id;
            const url = isEditing ? `/api/materials/${formData.id}` : "/api/materials";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} material`);
            }

            const saved = normalizeMaterial(await response.json());
            setMaterials((prev) =>
                isEditing ? prev.map((m) => (m.id === saved.id ? saved : m)) : [saved, ...prev]
            );
            setSuccessMessage(`Material ${isEditing ? "updated" : "added"} successfully!`);
            handleClose();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (material) => {
        setFormData({
            id: material.id,
            title: material.title,
            quantity: material.quantity,
            price: material.price,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this material?")) return;
        try {
            const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete material");
            setMaterials((prev) => prev.filter((m) => m.id !== id));
            setSuccessMessage("Material deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStockSubmit = async () => {
        if (!stockFormData.materialId || !stockFormData.addQuantity) {
            setStockError("Please select a material and enter quantity.");
            return;
        }
        const addQty = parseFloat(stockFormData.addQuantity);
        if (isNaN(addQty) || addQty <= 0) {
            setStockError("Add quantity must be greater than zero.");
            return;
        }
        setStockLoading(true);
        setStockError("");
        try {
            if (!currentMaterial) throw new Error("Material not found");
            const newQty = parseFloat(currentMaterial.quantity) + addQty;

            const res = await fetch(`/api/materials/${stockFormData.materialId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quantity: newQty,
                    adjustmentNotes: `Stock addition on ${new Date().toLocaleDateString()}`,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Stock update failed");
            }

            const updated = normalizeMaterial(await res.json());
            setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setSuccessMessage("Stock updated successfully!");
            setStockDialogOpen(false);
            resetStockForm();
        } catch (err) {
            setStockError(err.message);
        } finally {
            setStockLoading(false);
        }
    };

    const handleOutStockSubmit = async () => {
        if (!outStockFormData.materialId || !outStockFormData.outQuantity) {
            setOutStockError("Please select a material and enter quantity.");
            return;
        }
        const outQty = parseFloat(outStockFormData.outQuantity);
        if (isNaN(outQty) || outQty <= 0) {
            setOutStockError("Out quantity must be greater than zero.");
            return;
        }
        if (!outCurrentMaterial) {
            setOutStockError("Material not found.");
            return;
        }
        const currentQty = parseFloat(outCurrentMaterial.quantity);
        if (outQty > currentQty) {
            setOutStockError(`Cannot remove more than available stock (${currentQty} units).`);
            return;
        }
        setOutStockLoading(true);
        setOutStockError("");
        try {
            const newQty = currentQty - outQty;
            const res = await fetch(`/api/materials/${outStockFormData.materialId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quantity: newQty,
                    adjustmentNotes: outStockFormData.description || `Stock out on ${new Date().toLocaleDateString()}`,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Stock out failed");
            }

            const updated = normalizeMaterial(await res.json());
            setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setSuccessMessage("Stock out recorded successfully!");
            setOutStockDialogOpen(false);
            resetOutStockForm();
        } catch (err) {
            setOutStockError(err.message);
        } finally {
            setOutStockLoading(false);
        }
    };

    const handleView = async (id) => {
        try {
            const res = await fetch(`/api/materials/${id}`);
            const data = await res.json();
            setSelectedMaterial(data);
            setViewOpen(true);
        } catch {
            setError("Failed to load details");
        }
    };

    const filteredMaterials = materials.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /* ── render ──────────────────────────────────────── */

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action bar ─────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search materials…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 360 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={handleOpen}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        Add Material
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<History size={18} />}
                        onClick={() => setStockDialogOpen(true)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        Add Stock
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<TrendingDown size={18} />}
                        onClick={() => setOutStockDialogOpen(true)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        Out Stock
                    </Button>
                </Box>
            </Box>

            {/* ── Materials Table ─────────────────────────── */}
            <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
            >
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total Value</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredMaterials.length > 0 ? (
                                filteredMaterials.map((material) => (
                                    <TableRow
                                        key={material.id}
                                        sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={(t) => ({
                                                        width: 36,
                                                        height: 36,
                                                        bgcolor: t.palette.primary.light,
                                                        color: t.palette.primary.main,
                                                        borderRadius: 1.5,
                                                    })}
                                                >
                                                    <Package size={18} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {material.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID #{material.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${material.quantity} units`}
                                                size="small"
                                                color={material.quantity <= 5 ? "error" : "default"}
                                                variant={material.quantity <= 5 ? "filled" : "outlined"}
                                                sx={{ borderRadius: 1, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                Rs. {parseFloat(material.price).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} color="success.main">
                                                Rs. {(material.quantity * material.price).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(material.updatedAt).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" color="info" onClick={() => handleView(material.id)}>
                                                        <Eye size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Material">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(material)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Material">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                        <Trash2 size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Package size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                            No materials found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Add / Edit Material Dialog ──────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {formData.id ? "Edit Material" : "Add New Material"}
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {formError && (
                        <Alert
                            severity="error"
                            variant="filled"
                            onClose={() => setFormError("")}
                            sx={{ mb: 2.5, borderRadius: 2 }}
                        >
                            {formError}
                        </Alert>
                    )}

                    {/* All 3 fields on one row — each xs=4 for equal sizing */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Material Name"
                                name="title"
                                required
                                placeholder="e.g. Cotton Fabric"
                                value={formData.title}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Initial Quantity"
                                name="quantity"
                                required
                                type="number"
                                placeholder="e.g. 100"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Unit Price (Rs.)"
                                name="price"
                                required
                                type="number"
                                placeholder="e.g. 250"
                                value={formData.price}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>
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
                        disabled={loading}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        {loading
                            ? <CircularProgress size={20} color="inherit" />
                            : formData.id ? "Update Material" : "Save Material"
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Add Stock Dialog ────────────────────────── */}
            <Dialog
                open={stockDialogOpen}
                onClose={() => { setStockDialogOpen(false); resetStockForm(); }}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    Add Stock
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {stockError && (
                        <Alert
                            severity="error"
                            variant="filled"
                            onClose={() => setStockError("")}
                            sx={{ mb: 2.5, borderRadius: 2 }}
                        >
                            {stockError}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Material selector — full width row */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                size="small"
                                options={materials}
                                getOptionLabel={(option) => option.title || ""}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={currentMaterial || null}
                                onChange={(_, newValue) =>
                                    setStockFormData({ ...stockFormData, materialId: newValue ? newValue.id.toString() : "" })
                                }
                                sx={{ minWidth: 300 }}
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Material"
                                        required
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 3 quantity fields — only shown once a material is selected */}
                        {stockFormData.materialId && (
                            <>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Current Quantity"
                                        value={currentMaterial?.quantity ?? 0}
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Add Quantity"
                                        type="number"
                                        required
                                        placeholder="e.g. 50"
                                        value={stockFormData.addQuantity}
                                        onChange={(e) =>
                                            setStockFormData({ ...stockFormData, addQuantity: e.target.value })
                                        }
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="New Total"
                                        value={totalQty}
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
                                        sx={{
                                            "& .MuiFilledInput-root": {
                                                bgcolor: "success.light",
                                                color: "success.dark",
                                                fontWeight: 700,
                                            },
                                        }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => { setStockDialogOpen(false); resetStockForm(); }}
                        variant="outlined"
                        color="inherit"
                        disabled={stockLoading}
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleStockSubmit}
                        disabled={stockLoading || !stockFormData.materialId || !stockFormData.addQuantity}
                        startIcon={stockLoading ? null : <History size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        {stockLoading ? <CircularProgress size={20} color="inherit" /> : "Update Stock"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Out Stock Dialog ────────────────────────── */}
            <Dialog
                open={outStockDialogOpen}
                onClose={() => { setOutStockDialogOpen(false); resetOutStockForm(); }}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TrendingDown size={20} />
                        Out Stock
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {outStockError && (
                        <Alert
                            severity="error"
                            variant="filled"
                            onClose={() => setOutStockError("")}
                            sx={{ mb: 2.5, borderRadius: 2 }}
                        >
                            {outStockError}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Material selector */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                size="small"
                                options={materials}
                                getOptionLabel={(option) => option.title || ""}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={outCurrentMaterial || null}
                                onChange={(_, newValue) =>
                                    setOutStockFormData({ ...outStockFormData, materialId: newValue ? newValue.id.toString() : "" })
                                }
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Material"
                                        required
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        {outStockFormData.materialId && (
                            <>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Current Stock"
                                        value={outCurrentMaterial?.quantity ?? 0}
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Out Quantity"
                                        type="number"
                                        required
                                        placeholder="e.g. 10"
                                        value={outStockFormData.outQuantity}
                                        onChange={(e) =>
                                            setOutStockFormData({ ...outStockFormData, outQuantity: e.target.value })
                                        }
                                        inputProps={{ min: 1, max: parseFloat(outCurrentMaterial?.quantity || 0) }}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Remaining Stock"
                                        value={parseFloat(outTotalQty) < 0 ? "Exceeds stock!" : outTotalQty}
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
                                        sx={{
                                            "& .MuiFilledInput-root": {
                                                bgcolor: parseFloat(outTotalQty) < 0 ? "error.light" : "warning.light",
                                                color: parseFloat(outTotalQty) < 0 ? "error.dark" : "warning.dark",
                                                fontWeight: 700,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Description / Reason"
                                        placeholder="e.g. Used for booking #123, damaged, returned to supplier…"
                                        value={outStockFormData.description}
                                        onChange={(e) =>
                                            setOutStockFormData({ ...outStockFormData, description: e.target.value })
                                        }
                                        variant="outlined"
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => { setOutStockDialogOpen(false); resetOutStockForm(); }}
                        variant="outlined"
                        color="inherit"
                        disabled={outStockLoading}
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleOutStockSubmit}
                        disabled={
                            outStockLoading ||
                            !outStockFormData.materialId ||
                            !outStockFormData.outQuantity ||
                            parseFloat(outTotalQty) < 0
                        }
                        startIcon={outStockLoading ? null : <TrendingDown size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        {outStockLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Out Stock"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── View Details Dialog ─────────────────────── */}
            <Dialog
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Package size={20} />
                        Material Details
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: "20px !important" }}>
                    {selectedMaterial && (
                        <Grid container spacing={2}>
                            {[
                                { label: "Name", value: selectedMaterial.title },
                                { label: "Current Stock", value: `${selectedMaterial.quantity} units` },
                                { label: "Unit Price", value: `Rs. ${parseFloat(selectedMaterial.price).toLocaleString()}` },
                                {
                                    label: "Total Value",
                                    value: `Rs. ${(selectedMaterial.quantity * selectedMaterial.price).toLocaleString()}`,
                                },
                            ].map(({ label, value }) => (
                                <Grid key={label} size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {label}
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700}>
                                        {value}
                                    </Typography>
                                </Grid>
                            ))}

                            {selectedMaterial.movements?.length > 0 && (
                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
                                    >
                                        <History size={16} />
                                        Stock History
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: "action.hover" }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }} align="center">Type</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedMaterial.movements.map((mv) => (
                                                    <TableRow key={mv.id}>
                                                        <TableCell>
                                                            {new Date(mv.movedAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell align="right">{mv.quantity}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={mv.type}
                                                                size="small"
                                                                color={mv.type === "IN" ? "success" : "error"}
                                                                variant="filled"
                                                                sx={{ borderRadius: 1, fontWeight: 700, minWidth: 44 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {mv.notes || "—"}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
                    <Button
                        onClick={() => setViewOpen(false)}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Error Snackbar (delete / view errors) ───── */}
            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setError("")}
                    severity="error"
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {error}
                </Alert>
            </Snackbar>

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
