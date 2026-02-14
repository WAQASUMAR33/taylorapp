"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Chip,
    Autocomplete
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X as XIcon,
    Package,
    Tag,
    Layers,
    Hash,
    ClipboardList,
    Save
} from "lucide-react";

export default function ProductManagementClient({ initialProducts, categories }) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProdId, setSelectedProdId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        categoryId: "",
        quantity: 0,
        costPrice: "",
        unitPrice: "",
        cuttingCost: "",
        stitchingCost: "",
        materialCost: ""
    });

    const resetForm = () => {
        setFormData({
            sku: "",
            name: "",
            description: "",
            categoryId: "",
            quantity: 0,
            costPrice: "",
            unitPrice: "",
            cuttingCost: "",
            stitchingCost: "",
            materialCost: ""
        });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
    };

    const handleOpen = () => {
        resetForm();
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) {
            setShowForm(false);
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
            materialCost: prod.materialCost || ""
        });
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate Total Cost for Suit category (requires breakdown)
            const selectedCategory = categories.find(c => c.id === updated.categoryId);
            if (selectedCategory && selectedCategory.name.toLowerCase().includes('suit')) {
                // If any cost component or category changes, recalculate
                if (['cuttingCost', 'stitchingCost', 'materialCost', 'categoryId'].includes(name)) {
                    const cutting = parseFloat(updated.cuttingCost) || 0;
                    const stitching = parseFloat(updated.stitchingCost) || 0;
                    const material = parseFloat(updated.materialCost) || 0;
                    updated.costPrice = (cutting + stitching + material).toString();
                }
            }
            return updated;
        });
    };

    // Helper to check if selected category is "Suit" (needs breakdown)
    const isSuit = () => {
        if (!formData.categoryId) return false;
        const cat = categories.find(c => c.id === formData.categoryId);
        return cat && cat.name.toLowerCase().includes('suit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                throw new Error(data.error || `Failed to ${editMode ? 'update' : 'create'} product`);
            }

            // Refresh products
            const refreshRes = await fetch("/api/products");
            const refreshedProds = await refreshRes.json();
            setProducts(refreshedProds);

            setSuccessMessage(`Product ${editMode ? 'updated' : 'added'} successfully!`);
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: "DELETE",
            });

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

    const filteredProducts = products.filter(prod =>
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {editMode ? "EDIT PRODUCT" : "NEW PRODUCT"}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<XIcon size={18} />}
                                onClick={handleClose}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Product Name</Typography>
                                <TextField
                                    fullWidth
                                    name="name"
                                    required
                                    placeholder="e.g. Cotton Shirt"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Package size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>SKU / Barcode</Typography>
                                <TextField
                                    fullWidth
                                    name="sku"
                                    required
                                    placeholder="e.g. SHIRT-001"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Hash size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Category</Typography>
                                <Autocomplete
                                    options={categories}
                                    getOptionLabel={(option) => option.name || ""}
                                    value={categories.find(c => c.id === formData.categoryId) || null}
                                    onChange={(event, newValue) => {
                                        const syntheticEvent = {
                                            target: {
                                                name: 'categoryId',
                                                value: newValue ? newValue.id : ""
                                            }
                                        };
                                        handleInputChange(syntheticEvent);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select category"
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start" sx={{ ml: 1 }}>
                                                            <Layers size={18} color="#9ca3af" />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {isSuit() ? (
                                <>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Cutting Cost</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="cuttingCost"
                                            placeholder="e.g. 500"
                                            value={formData.cuttingCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 600, color: '#374151', mr: 1 }}>Rs.</Typography></InputAdornment>,
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Stitching Cost</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="stitchingCost"
                                            placeholder="e.g. 1500"
                                            value={formData.stitchingCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 600, color: '#374151', mr: 1 }}>Rs.</Typography></InputAdornment>,
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Material Cost</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="materialCost"
                                            placeholder="e.g. 1000"
                                            value={formData.materialCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 600, color: '#374151', mr: 1 }}>Rs.</Typography></InputAdornment>,
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Total Cost (Calculated)</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="costPrice"
                                            value={formData.costPrice}
                                            InputProps={{
                                                readOnly: true,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>Rs.</Typography>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            variant="filled"
                                            sx={{
                                                '& .MuiFilledInput-root': {
                                                    bgcolor: '#f1f5f9',
                                                    borderRadius: '10px',
                                                }
                                            }}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Cost Price</Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="costPrice"
                                        placeholder="e.g. 3000"
                                        value={formData.costPrice}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>Rs.</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'white',
                                                borderRadius: '10px',
                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                '&:hover fieldset': { borderColor: '#3b82f6' },
                                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                            }
                                        }}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Unit Price (Selling Price)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="unitPrice"
                                    placeholder="e.g. 4500"
                                    value={formData.unitPrice}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 600 }}>Rs.</Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Initial Quantity</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="quantity"
                                    placeholder="e.g. 100"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ClipboardList size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1.5, mt: 1, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        Description
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="description"
                                    placeholder="e.g. High quality cotton fabric with premium stitching..."
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search by name, SKU, or category..."
                    variant="outlined"
                    size="small"
                    sx={{ width: 450, bgcolor: 'white' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                >
                    Add Product
                </Button>
            </Box>

            {/* Products Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Product Details</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Stock</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((prod) => (
                                <TableRow
                                    key={prod.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{
                                                p: 1,
                                                bgcolor: '#f5f3ff',
                                                borderRadius: 2,
                                                color: '#8b5cf6'
                                            }}>
                                                <Package size={20} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {prod.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                    {prod.description || 'No description'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tag size={14} className="text-zinc-400" />
                                            <Typography variant="body2">
                                                {prod.category?.name || 'Uncategorized'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: prod.quantity <= 5 ? '#ef4444' : 'inherit'
                                            }}
                                        >
                                            {prod.quantity} Units
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                                                Selling: Rs. {parseFloat(prod.unitPrice || 0).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Cost: Rs. {parseFloat(prod.costPrice || 0).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(prod)}>
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(prod.id)}
                                            >
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No products found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Success Notification */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
