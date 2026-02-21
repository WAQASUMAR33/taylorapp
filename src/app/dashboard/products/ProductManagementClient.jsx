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
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    Divider,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X as XIcon,
    Package,
    Tag,
    Save,
    Layers,
} from "lucide-react";

const CATEGORY_COLORS = [
    { bg: "#ede9fe", color: "#7c3aed" },
    { bg: "#dbeafe", color: "#2563eb" },
    { bg: "#d1fae5", color: "#059669" },
    { bg: "#fef3c7", color: "#d97706" },
    { bg: "#fee2e2", color: "#dc2626" },
    { bg: "#fce7f3", color: "#db2777" },
    { bg: "#e0e7ff", color: "#4338ca" },
    { bg: "#ccfbf1", color: "#0d9488" },
    { bg: "#fef9c3", color: "#ca8a04" },
    { bg: "#f3e8ff", color: "#9333ea" },
];

function getCategoryColor(catName) {
    if (!catName) return { bg: "#f3f4f6", color: "#6b7280" };
    let hash = 0;
    for (let i = 0; i < catName.length; i++) hash = catName.charCodeAt(i) + ((hash << 5) - hash);
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export default function ProductManagementClient({ initialProducts, categories }) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog state
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProdId, setSelectedProdId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: "",
        quantity: 0,
        costPrice: "",
        unitPrice: "",
        cuttingCost: "",
        stitchingCost: "",
        materialCost: "",
    });

    // Quick-add category dialog
    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatLoading, setNewCatLoading] = useState(false);
    const [localCategories, setLocalCategories] = useState(categories);

    /* ── helpers ─────────────────────────────────────── */

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            categoryId: "",
            quantity: 0,
            costPrice: "",
            unitPrice: "",
            cuttingCost: "",
            stitchingCost: "",
            materialCost: "",
        });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
    };

    const isSuit = () => {
        if (!formData.categoryId) return false;
        const cat = localCategories?.find(c => c.id === formData.categoryId);
        return cat?.name?.toLowerCase().includes("suit");
    };

    /* ── handlers ────────────────────────────────────── */

    const handleOpen = () => {
        resetForm();
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) {
            setOpen(false);
            resetForm();
        }
    };

    const handleEdit = (prod) => {
        setEditMode(true);
        setSelectedProdId(prod.id);
        setFormData({
            name: prod.name || "",
            description: prod.description || "",
            categoryId: prod.categoryId || "",
            quantity: prod.quantity || 0,
            costPrice: prod.costPrice || "",
            unitPrice: prod.unitPrice || "",
            cuttingCost: prod.cuttingCost || "",
            stitchingCost: prod.stitchingCost || "",
            materialCost: prod.materialCost || "",
        });
        setOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            const selectedCategory = localCategories?.find(c => c.id === updated.categoryId);
            if (selectedCategory?.name?.toLowerCase().includes("suit")) {
                if (["cuttingCost", "stitchingCost", "materialCost", "categoryId"].includes(name)) {
                    const cutting = parseFloat(updated.cuttingCost) || 0;
                    const stitching = parseFloat(updated.stitchingCost) || 0;
                    const material = parseFloat(updated.materialCost) || 0;
                    updated.costPrice = (cutting + stitching + material).toString();
                }
            }
            return updated;
        });
    };

    const handleQuickAddCategory = async () => {
        if (!newCatName) return;
        setNewCatLoading(true);
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName }),
            });
            if (!response.ok) throw new Error("Failed to add category");
            const newCat = await response.json();
            setLocalCategories(prev => [...prev, newCat]);
            setFormData(prev => ({ ...prev, categoryId: newCat.id }));
            setQuickAddCatOpen(false);
            setNewCatName("");
            setSuccessMessage("Category added successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setNewCatLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const method = editMode ? "PUT" : "POST";
            const finalSku = editMode
                ? products.find(p => p.id === selectedProdId)?.sku
                : `PRD-${Date.now()}`;
            const payload = editMode
                ? { ...formData, id: selectedProdId, sku: finalSku }
                : { ...formData, sku: finalSku };

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
        (prod.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCategory = localCategories?.find(c => c.id === formData.categoryId) || null;

    /* ── render ──────────────────────────────────────── */

    // Category counts for summary cards
    const categoryCounts = {};
    (products || []).forEach(p => {
        const catName = p.category?.name || "Uncategorized";
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });
    const categoryEntries = Object.entries(categoryCounts);

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Category Summary Cards ────────────────── */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
                {categoryEntries.map(([name, count]) => {
                    const cc = getCategoryColor(name);
                    return (
                        <Card key={name} elevation={0}
                            sx={{
                                border: "1px solid", borderColor: cc.bg,
                                borderRadius: 2.5, px: 2, py: 1.2,
                                bgcolor: cc.bg, minWidth: 120,
                                display: "flex", alignItems: "center", gap: 1.5,
                            }}>
                            <Box sx={{ p: 0.75, bgcolor: cc.color, borderRadius: 1.5, display: "flex" }}>
                                <Layers size={14} color="white" />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} sx={{ color: cc.color, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.04em" }}>
                                    {name}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: cc.color, lineHeight: 1.1 }}>
                                    {count} {count === 1 ? "product" : "products"}
                                </Typography>
                            </Box>
                        </Card>
                    );
                })}
            </Box>

            {/* ── Action bar ─────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    gap: 2,
                }}
            >
                <TextField
                    placeholder="Search by name or category…"
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
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                >
                    Add Product
                </Button>
            </Box>

            {/* ── Products table ──────────────────────────── */}
            <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
            >
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Cost</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Sale Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((prod) => (
                                    <TableRow
                                        key={prod.id}
                                        sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {prod.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {prod.description || "No description"}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const catName = prod.category?.name || "Uncategorized";
                                                const cc = getCategoryColor(catName);
                                                return (
                                                    <Chip
                                                        label={catName}
                                                        size="small"
                                                        sx={{ borderRadius: 1, fontWeight: 600, bgcolor: cc.bg, color: cc.color, border: "none" }}
                                                    />
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${prod.quantity} units`}
                                                size="small"
                                                color={prod.quantity <= 5 ? "error" : "default"}
                                                variant={prod.quantity <= 5 ? "filled" : "outlined"}
                                                sx={{ borderRadius: 1, fontWeight: 600 }}
                                            />
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
                                                    <IconButton size="small" onClick={() => handleEdit(prod)}
                                                        sx={{ bgcolor: '#3b82f6', color: 'white', borderRadius: 1.5, '&:hover': { bgcolor: '#2563eb' } }}>
                                                        <Edit size={15} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Product">
                                                    <IconButton size="small" onClick={() => handleDelete(prod.id)}
                                                        sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: 1.5, '&:hover': { bgcolor: '#dc2626' } }}>
                                                        <Trash2 size={15} />
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
                                            No products found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Add / Edit Product Dialog ───────────────── */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
                >
                    {editMode ? "Edit Product" : "Add New Product"}
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert
                            severity="error"
                            variant="filled"
                            onClose={() => setError("")}
                            sx={{ mb: 2.5, borderRadius: 2 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>

                        {/* Row 1: Category (+) | Product Name | Sale Price */}
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 300, flex: "1 1 300px" }}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={localCategories || []}
                                getOptionLabel={(option) => option.name || ""}
                                value={selectedCategory}
                                onChange={(_, newValue) => {
                                    handleInputChange({
                                        target: { name: "categoryId", value: newValue ? newValue.id : "" },
                                    });
                                }}
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Category" variant="outlined" />
                                )}
                            />
                            <Tooltip title="New Category">
                                <IconButton
                                    onClick={() => setQuickAddCatOpen(true)}
                                    size="small"
                                    sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        borderRadius: 1.5,
                                        flexShrink: 0,
                                        width: 40,
                                        height: 40,
                                        "&:hover": { bgcolor: "primary.dark" },
                                    }}
                                >
                                    <Plus size={20} />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <TextField
                            sx={{ minWidth: 300, flex: "1 1 300px" }}
                            size="small"
                            label="Product Name"
                            name="name"
                            required
                            placeholder="e.g. Cotton Shirt"
                            value={formData.name}
                            onChange={handleInputChange}
                            variant="outlined"
                        />

                        <TextField
                            sx={{ minWidth: 300, flex: "1 1 300px" }}
                            size="small"
                            label="Sale Price (Rs.)"
                            name="unitPrice"
                            type="number"
                            required
                            placeholder="e.g. 4500"
                            value={formData.unitPrice}
                            onChange={handleInputChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                            }}
                        />

                        {/* Row 2: Cost fields — changes based on suit */}
                        {isSuit() ? (
                            <>
                                <TextField
                                    sx={{ minWidth: 300, flex: "1 1 300px" }}
                                    size="small"
                                    label="Cutting Cost (Rs.)"
                                    name="cuttingCost"
                                    type="number"
                                    required
                                    placeholder="e.g. 500"
                                    value={formData.cuttingCost}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    sx={{ minWidth: 300, flex: "1 1 300px" }}
                                    size="small"
                                    label="Stitching Cost (Rs.)"
                                    name="stitchingCost"
                                    type="number"
                                    required
                                    placeholder="e.g. 1500"
                                    value={formData.stitchingCost}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    sx={{ minWidth: 300, flex: "1 1 300px" }}
                                    size="small"
                                    label="Material Cost (Rs.)"
                                    name="materialCost"
                                    type="number"
                                    required
                                    placeholder="e.g. 1000"
                                    value={formData.materialCost}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    sx={{ minWidth: 300, flex: "1 1 300px" }}
                                    size="small"
                                    label="Total Cost (Calculated)"
                                    name="costPrice"
                                    type="number"
                                    value={formData.costPrice}
                                    variant="filled"
                                    InputProps={{ readOnly: true }}
                                />
                            </>
                        ) : (
                            <TextField
                                sx={{ minWidth: 300, flex: "1 1 300px" }}
                                size="small"
                                label="Cost Price (Rs.)"
                                name="costPrice"
                                type="number"
                                required
                                placeholder="e.g. 3000"
                                value={formData.costPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                }}
                            />
                        )}

                        {/* Quantity */}
                        <TextField
                            sx={{ minWidth: 300, flex: "1 1 300px" }}
                            size="small"
                            label="Initial Quantity"
                            name="quantity"
                            type="number"
                            required
                            placeholder="e.g. 10"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            variant="outlined"
                        />

                        {/* Description — full width */}
                        <TextField
                            sx={{ minWidth: 400, flex: "1 1 100%" }}
                            size="small"
                            label="Description"
                            name="description"
                            placeholder="e.g. High quality cotton fabric with premium stitching…"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            variant="outlined"
                        />

                    </Box>
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
                        sx={{ borderRadius: 2, textTransform: "none", px: 3, fontWeight: 600 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : editMode ? "Update Product" : "Save Product"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Quick Add Category Dialog ───────────────── */}
            <Dialog
                open={quickAddCatOpen}
                onClose={() => setQuickAddCatOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    New Category
                </DialogTitle>
                <DialogContent sx={{ pt: "20px !important" }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Category Name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleQuickAddCategory()}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setQuickAddCatOpen(false)}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleQuickAddCategory}
                        disabled={newCatLoading || !newCatName.trim()}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                        {newCatLoading ? <CircularProgress size={20} color="inherit" /> : "Add Category"}
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
