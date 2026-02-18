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
    Grid,
    Alert,
    Snackbar,
    Chip,
    Card,
    InputAdornment,
    CircularProgress
} from "@mui/material";
import { Search, Plus, Edit, Trash2, Users, Tag, Save, X as XIcon } from "lucide-react";

export default function AccountCategoryClient({ initialCategories }) {
    const [categories, setCategories] = useState(initialCategories);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [categoryName, setCategoryName] = useState("");

    const handleOpen = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName("");
        }
        setShowForm(true);
    };

    const handleClose = () => {
        setShowForm(false);
        setEditingCategory(null);
        setCategoryName("");
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const url = "/api/account-categories";
            const method = editingCategory ? "PUT" : "POST";
            const payload = editingCategory
                ? { id: editingCategory.id, name: categoryName }
                : { name: categoryName };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save category");
            }

            // Refresh categories
            const refreshRes = await fetch("/api/account-categories");
            const refreshed = await refreshRes.json();
            setCategories(refreshed);

            setSuccessMessage(editingCategory ? "Category updated successfully!" : "Category created successfully!");
            setShowForm(false);
            setEditingCategory(null);
            setCategoryName("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, customerCount) => {
        if (customerCount > 0) {
            setError(`Cannot delete this category. ${customerCount} customer(s) are using it.`);
            return;
        }

        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const response = await fetch(`/api/account-categories?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete");
            }

            setCategories(prev => prev.filter(c => c.id !== id));
            setSuccessMessage("Category deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCustomers = categories.reduce((sum, cat) => sum + (cat._count?.customers || 0), 0);

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }} className="font-urdu">
                            {editingCategory ? 'کیٹگری تبدیل کریں' : 'نئی کیٹگری'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading || !categoryName.trim()}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                                className="font-urdu"
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "محفوظ کریں"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<XIcon size={18} />}
                                onClick={handleClose}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                                className="font-urdu"
                            >
                                کینسل
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">کیٹگری کا نام</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    placeholder="نام درج کریں"
                                    required
                                    dir="rtl"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        },
                                        '& .MuiOutlinedInput-input': { textAlign: 'right' }
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
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: '#f5f3ff', border: '2px solid #8b5cf620' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#8b5cf620', borderRadius: 2, color: '#8b5cf6' }}>
                                <Tag size={24} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                                    {categories.length}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Total Categories
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: '#dbeafe', border: '2px solid #3b82f620' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#3b82f620', borderRadius: 2, color: '#3b82f6' }}>
                                <Users size={24} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                                    {totalCustomers}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Total Customers
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search categories..."
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
                    onClick={() => handleOpen()}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                >
                    Add Category
                </Button>
            </Box>

            {/* Categories Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Category Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customers</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <TableRow
                                    key={category.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tag size={16} className="text-purple-600" />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {category.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={category._count?.customers || 0}
                                            size="small"
                                            sx={{
                                                bgcolor: '#f5f3ff',
                                                color: '#8b5cf6',
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={category.isActive ? "Active" : "Inactive"}
                                            size="small"
                                            sx={{
                                                bgcolor: category.isActive ? '#d1fae5' : '#fee2e2',
                                                color: category.isActive ? '#065f46' : '#991b1b',
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpen(category)}
                                        >
                                            <Edit size={18} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(category.id, category._count?.customers || 0)}
                                        >
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No categories found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
