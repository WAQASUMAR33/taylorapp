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
    Tooltip,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    Save,
    X as XIcon,
    Package,
    ChevronUp,
    ChevronDown,
    Eye,
    History
} from "lucide-react";

export default function MaterialManagementClient({ initialMaterials }) {
    const [materials, setMaterials] = useState(initialMaterials);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [viewOpen, setViewOpen] = useState(false);
    const [stockDialogOpen, setStockDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        quantity: "",
        price: ""
    });

    const [stockFormData, setStockFormData] = useState({
        materialId: "",
        addQuantity: ""
    });

    const resetForm = () => {
        setFormData({ title: "", quantity: "", price: "" });
        setError("");
    };

    const resetStockForm = () => {
        setStockFormData({ materialId: "", addQuantity: "" });
    };

    const handleOpen = () => {
        resetForm();
        setShowForm(true);
    };

    const handleClose = () => {
        setShowForm(false);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const isEditing = formData.id;
            const url = isEditing ? `/api/materials/${formData.id}` : "/api/materials";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} material`);
            }

            const savedMaterial = await response.json();

            if (isEditing) {
                setMaterials(prev => prev.map(m => m.id === savedMaterial.id ? savedMaterial : m));
                setSuccessMessage("Material updated successfully!");
            } else {
                setMaterials(prev => [savedMaterial, ...prev]);
                setSuccessMessage("Material added successfully!");
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (material) => {
        setFormData({
            id: material.id,
            title: material.title,
            quantity: material.quantity,
            price: material.price
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this material?")) return;

        try {
            const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete material");

            setMaterials(prev => prev.filter(m => m.id !== id));
            setSuccessMessage("Material deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleManualQuantity = async (material, value) => {
        // Removed inline quantity editing
    };

    const handleStockSubmit = async () => {
        if (!stockFormData.materialId || !stockFormData.addQuantity) {
            setError("Please fill all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const material = materials.find(m => m.id === parseInt(stockFormData.materialId));
            if (!material) throw new Error("Material not found");

            const newQty = parseFloat(material.quantity) + parseFloat(stockFormData.addQuantity);

            const response = await fetch(`/api/materials/${stockFormData.materialId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quantity: newQty,
                    adjustmentNotes: `Stock addition on ${new Date().toLocaleDateString()}`
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Stock update failed");
            }

            const updated = await response.json();
            setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
            setSuccessMessage("Stock updated successfully!");
            setStockDialogOpen(false);
            resetStockForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (id) => {
        try {
            const response = await fetch(`/api/materials/${id}`);
            const data = await response.json();
            setSelectedMaterial(data);
            setViewOpen(true);
        } catch (err) {
            setError("Failed to load details");
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // List view is now the only view
    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search materials..."
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
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                        Add New Material
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<History size={18} />}
                        onClick={() => setStockDialogOpen(true)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            py: 1,
                            bgcolor: '#f59e0b',
                            '&:hover': { bgcolor: '#d97706' }
                        }}
                    >
                        Add Stock
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Material Details</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Updated Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMaterials.map((material) => (
                            <TableRow key={material.id} sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: '#f5f3ff', borderRadius: 2, color: '#8b5cf6' }}>
                                            <Package size={20} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{material.title}</Typography>
                                            <Typography variant="caption" color="textSecondary">ID: #{material.id}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {material.quantity}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                    Rs. {parseFloat(material.price).toFixed(2)}
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    {new Date(material.updatedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton size="small" color="primary" onClick={() => handleView(material.id)}>
                                            <Eye size={18} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleEdit(material)}>
                                            <Edit size={18} />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={20} color="#8b5cf6" />
                    Material Details
                </DialogTitle>
                <DialogContent>
                    {selectedMaterial && (
                        <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Title</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedMaterial.title}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Current Stock</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedMaterial.quantity}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Unit Price</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>Rs. {parseFloat(selectedMaterial.price).toFixed(2)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Total Value</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>Rs. {(selectedMaterial.quantity * selectedMaterial.price).toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" sx={{ mt: 4, mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <History size={16} />
                                Stock History
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedMaterial.movements?.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: m.type === 'IN' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                                                        {m.type}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{m.quantity}</TableCell>
                                                <TableCell>{new Date(m.movedAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add Stock Dialog */}
            <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f59e0b', color: 'white', mb: 2 }} className="font-urdu">سٹاک اپ ڈیٹ کریں</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} className="font-urdu">مٹیریل منتخب کریں</Typography>
                            </Box>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={materials}
                                getOptionLabel={(option) => option.title}
                                value={materials.find(m => m.id === parseInt(stockFormData.materialId)) || null}
                                onChange={(e, newValue) => {
                                    setStockFormData({ ...stockFormData, materialId: newValue ? newValue.id.toString() : "" });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        dir="rtl"
                                        placeholder="تلاش کریں..."
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px'
                                            },
                                            '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {stockFormData.materialId && (
                            <>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="font-urdu">پہلے والی مقدار</Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        disabled
                                        dir="rtl"
                                        value={materials.find(m => m.id === parseInt(stockFormData.materialId))?.quantity || 0}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="font-urdu">نئی مقدار شامل کریں</Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        required
                                        dir="rtl"
                                        value={stockFormData.addQuantity}
                                        onChange={(e) => setStockFormData({ ...stockFormData, addQuantity: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="font-urdu">کل مقدار</Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        disabled
                                        dir="rtl"
                                        value={
                                            (parseFloat(materials.find(m => m.id === parseInt(stockFormData.materialId))?.quantity || 0) +
                                                parseFloat(stockFormData.addQuantity || 0)).toFixed(2)
                                        }
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f0fdf4' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'row-reverse' }}>
                    <Button
                        onClick={handleStockSubmit}
                        variant="contained"
                        disabled={loading || !stockFormData.materialId || !stockFormData.addQuantity}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                        className="font-urdu"
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "اپ ڈیٹ کریں"}
                    </Button>
                    <Button onClick={() => setStockDialogOpen(false)} color="inherit" className="font-urdu">کینسل</Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Material Dialog */}
            <Dialog open={showForm} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, bgcolor: '#8b5cf6', color: 'white', mb: 2 }} className="font-urdu">
                    {formData.id ? 'مٹیریل تبدیل کریں' : 'نیا مٹیریل شامل کریں'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }} className="font-urdu">نام</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                name="title"
                                required
                                dir="rtl"
                                placeholder="نام درج کریں"
                                value={formData.title}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }} className="font-urdu">ابتدائی مقدار</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                name="quantity"
                                required
                                dir="rtl"
                                type="number"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }} className="font-urdu">قیمت فی یونٹ</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                name="price"
                                required
                                dir="rtl"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' }, '& .MuiOutlinedInput-input': { textAlign: 'right' } }}
                            />
                        </Grid>
                    </Grid>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'row-reverse' }}>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        className="font-urdu"
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "محفوظ کریں"}
                    </Button>
                    <Button onClick={handleClose} color="inherit" className="font-urdu">کینسل</Button>
                </DialogActions>
            </Dialog>

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
