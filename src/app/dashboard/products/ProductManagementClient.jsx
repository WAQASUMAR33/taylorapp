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

    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatLoading, setNewCatLoading] = useState(false);
    const [localCategories, setLocalCategories] = useState(categories);

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
            materialCost: ""
        });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
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
            // Generate a random SKU since it's required by the DB but removed from UI
            const finalSku = editMode ? products.find(p => p.id === selectedProdId)?.sku : `PRD-${Date.now()}`;
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
        prod.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'right' }}>
                            {editMode ? "پروڈکٹ میں ترمیم کریں" : "نیا پروڈکٹ"}
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
                        <Grid container spacing={3} sx={{ direction: 'rtl' }}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>پروڈکٹ کا نام</Typography>
                                <TextField
                                    fullWidth
                                    name="name"
                                    required
                                    placeholder="مثال: کاٹن شرٹ"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    inputProps={{ style: { textAlign: 'right' } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>کیٹیگری</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Autocomplete
                                        fullWidth
                                        options={localCategories}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={localCategories.find(c => c.id === formData.categoryId) || null}
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
                                                placeholder="کیٹیگری منتخب کریں"
                                                variant="outlined"
                                                inputProps={{ ...params.inputProps, style: { textAlign: 'right' } }}
                                                sx={{
                                                    minWidth: '300px',
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
                                    <IconButton
                                        onClick={() => setQuickAddCatOpen(true)}
                                        sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6', '&:hover': { bgcolor: '#ede9fe' } }}
                                    >
                                        <Plus size={20} />
                                    </IconButton>
                                </Box>
                            </Grid>

                            {isSuit() ? (
                                <>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>کٹنگ لاگت</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="cuttingCost"
                                            placeholder="مثال: 500"
                                            value={formData.cuttingCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 600, color: '#374151', ml: 1 }}>روپے</Typography></InputAdornment>,
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
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>سلائی لاگت</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="stitchingCost"
                                            placeholder="مثال: 1500"
                                            value={formData.stitchingCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 600, color: '#374151', ml: 1 }}>روپے</Typography></InputAdornment>,
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
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>میٹیرئیل لاگت</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="materialCost"
                                            placeholder="مثال: 1000"
                                            value={formData.materialCost}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 600, color: '#374151', ml: 1 }}>روپے</Typography></InputAdornment>,
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
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>کل لاگت (حساب شدہ)</Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            name="costPrice"
                                            value={formData.costPrice}
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>روپے</Typography>
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
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>لاگت کی قیمت</Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="costPrice"
                                        placeholder="مثال: 3000"
                                        value={formData.costPrice}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        inputProps={{ style: { textAlign: 'right' } }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>روپے</Typography>
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>یونٹ کی قیمت (فروخت کی قیمت)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="unitPrice"
                                    placeholder="مثال: 4500"
                                    value={formData.unitPrice}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    inputProps={{ style: { textAlign: 'right' } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>روپے</Typography>
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>ابتدائی مقدار</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="quantity"
                                    placeholder="مثال: 100"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    inputProps={{ style: { textAlign: 'right' } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
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
                                <Box sx={{ mb: 1.5, mt: 1, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 1.5, borderRight: '4px solid #8b5cf6', pr: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        تفصیل
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="description"
                                    placeholder="مثال: پریمیم سلائی کے ساتھ اعلیٰ کوالٹی کا سوتی کپڑا..."
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    inputProps={{ style: { textAlign: 'right' } }}
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

                {/* Quick Add Category Dialog */}
                <Dialog open={quickAddCatOpen} onClose={() => setQuickAddCatOpen(false)}>
                    <DialogTitle sx={{ fontWeight: 600 }}>نئی کیٹیگری لاگ انگ کریں</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 1 }}>
                            <TextField
                                fullWidth
                                label="کیٹیگری کا نام"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                autoFocus
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setQuickAddCatOpen(false)}>منسوخ کریں</Button>
                        <Button
                            variant="contained"
                            onClick={handleQuickAddCategory}
                            disabled={newCatLoading || !newCatName}
                            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                        >
                            {newCatLoading ? <CircularProgress size={24} /> : "شامل کریں"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="نام، یا کیٹیگری سے تلاش کریں..."
                    variant="outlined"
                    size="small"
                    sx={{ width: 450, bgcolor: 'white' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputProps={{ style: { textAlign: 'right' } }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
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
                    پروڈکٹ شامل کریں
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
                                                {/* SKU was here, but it's being removed as per instruction */}
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
