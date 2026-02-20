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
    Tooltip
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X,
    Tag,
    Layers,
    Save
} from "lucide-react";

export default function CategoryManagementClient({ initialCategories }) {
    const [categories, setCategories] = useState(initialCategories);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const resetForm = () => {
        setFormData({
            name: "",
            description: ""
        });
        setEditMode(false);
        setSelectedCatId(null);
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

    const handleEdit = (cat) => {
        setEditMode(true);
        setSelectedCatId(cat.id);
        setFormData({
            name: cat.name || "",
            description: cat.description || ""
        });
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedCatId } : formData;

            const response = await fetch("/api/categories", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? 'update' : 'create'} category`);
            }

            // Refresh categories
            const refreshRes = await fetch("/api/categories");
            const refreshedCats = await refreshRes.json();
            setCategories(refreshedCats);

            setSuccessMessage(`Category ${editMode ? 'updated' : 'added'} successfully!`);
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const response = await fetch(`/api/categories?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete category");
            }

            setCategories(prev => prev.filter(c => c.id !== id));
            setSuccessMessage("Category deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredCategories = (categories || []).filter(cat => {
        const query = (searchQuery || "").toLowerCase();
        return (cat.name || "").toLowerCase().includes(query) ||
            (cat.description || "").toLowerCase().includes(query);
    });

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {editMode ? "Edit Category" : "New Category"}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<X size={18} />}
                                onClick={handleClose}
                                color="error"
                                sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading}
                                color="success"
                                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Name</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="name"
                                    required
                                    placeholder="Enter name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'background.paper',
                                            borderRadius: 2,
                                            '& fieldset': { borderColor: 'divider' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Description
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="description"
                                    required
                                    placeholder="Enter description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'background.paper',
                                            borderRadius: 2,
                                            '& fieldset': { borderColor: 'divider' },
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
                    placeholder="Search categories..."
                    variant="outlined"
                    size="small"
                    sx={{ width: 450, bgcolor: 'background.paper' }}
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
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    Add Category
                </Button>
            </Box>

            {/* Categories Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Category Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 350 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Products</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat) => (
                                <TableRow
                                    key={cat.id}
                                    sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{
                                                p: 1,
                                                bgcolor: 'primary.light',
                                                borderRadius: 2,
                                                color: 'primary.main'
                                            }}>
                                                <Tag size={20} />
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {cat.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {cat.description || 'No description provided'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Layers size={14} color="#9ca3af" />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {cat._count?.products || 0}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(cat)}>
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(cat.id)}
                                                disabled={cat._count?.products > 0}
                                            >
                                                <Tooltip title={cat._count?.products > 0 ? "Cannot delete category with products" : "Delete category"}>
                                                    <span><Trash2 size={18} /></span>
                                                </Tooltip>
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary">No categories found.</Typography>
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
