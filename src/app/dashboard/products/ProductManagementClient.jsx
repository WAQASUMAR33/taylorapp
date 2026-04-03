"use client";

import { useState } from "react";
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
    Avatar,
    Grid,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X as XIcon,
    Package,
    Save,
} from "lucide-react";

export default function ProductManagementClient({ initialProducts }) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProdId, setSelectedProdId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        quantity: 0,
        costPrice: "",
        unitPrice: "",
    });

    const resetForm = () => {
        setFormData({ sku: "", name: "", description: "", quantity: 0, costPrice: "", unitPrice: "" });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
    };

    const handleOpen = () => {
        resetForm();
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) { setOpen(false); resetForm(); }
    };

    const handleEdit = (prod) => {
        setEditMode(true);
        setSelectedProdId(prod.id);
        setFormData({
            sku: prod.sku || "",
            name: prod.name || "",
            description: prod.description || "",
            quantity: prod.quantity || 0,
            costPrice: prod.costPrice || "",
            unitPrice: prod.unitPrice || "",
        });
        setOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedProdId } : formData;

            const response = await fetch("/api/products", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? "update" : "create"} product`);
            }

            const refreshRes = await fetch("/api/products");
            const refreshedProds = await refreshRes.json();
            setProducts(refreshedProds);
            setSuccessMessage(`Product ${editMode ? "updated" : "added"} successfully!`);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const response = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete product");
            }
            setProducts(prev => prev.filter(p => p.id !== id));
            setSuccessMessage("Product deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredProducts = (products || []).filter(prod =>
        (prod.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action bar ─────────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search by name or product code…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 360 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                >
                    Add Product
                </Button>
            </Box>

            {/* ── Products table ──────────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Cost Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Sale Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((prod) => (
                                    <TableRow key={prod.id} sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={(t) => ({
                                                        width: 36, height: 36,
                                                        bgcolor: t.palette.primary.light,
                                                        color: t.palette.primary.main,
                                                        borderRadius: 1.5,
                                                    })}
                                                >
                                                    <Package size={18} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{prod.name}</Typography>
                                                    {prod.description && (
                                                        <Typography variant="caption" color="text.secondary">{prod.description}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: "action.hover", px: 1, py: 0.3, borderRadius: 1, display: "inline-block" }}>
                                                {prod.sku}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                sx={{ color: prod.quantity <= 5 ? "error.main" : "success.main" }}
                                            >
                                                {prod.quantity} units
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                Rs. {parseFloat(prod.costPrice || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} color="success.main">
                                                Rs. {parseFloat(prod.unitPrice || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                                <Tooltip title="Edit Product">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(prod)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Product">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(prod.id)}>
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
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>No products found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Add / Edit Product Dialog ───────────────────── */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {editMode ? "Edit Product" : "Add New Product"}
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Product Code" name="sku" required
                                placeholder="e.g. PRD-001"
                                value={formData.sku}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Product Name" name="name" required
                                placeholder="e.g. Cotton Shirt"
                                value={formData.name}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth size="small" label="Cost Price" name="costPrice" type="number"
                                placeholder="0.00"
                                value={formData.costPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth size="small" label="Sale Price" name="unitPrice" type="number" required
                                placeholder="0.00"
                                value={formData.unitPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth size="small" label="Stock Quantity" name="quantity" type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth size="small" label="Description" name="description"
                                placeholder="Optional description…"
                                multiline rows={2}
                                value={formData.description}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading} startIcon={<XIcon size={17} />} sx={{ borderRadius: 2, textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained" onClick={handleSubmit}
                        disabled={loading || !formData.name?.trim() || !formData.sku?.trim()}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3, fontWeight: 600 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : editMode ? "Update Product" : "Save Product"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ────────────────────────────── */}
            <Snackbar
                open={!!successMessage} autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
