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
    Card,
    InputAdornment,
    CircularProgress
} from "@mui/material";
import { Search, Plus, Edit, Trash2, Landmark, Save, X as XIcon, Hash, GitBranch } from "lucide-react";

export default function BankManagementClient({ initialBanks }) {
    const [banks, setBanks] = useState(initialBanks);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        accountNumber: "",
        branch: "",
        balance: 0
    });

    const handleOpen = (bank = null) => {
        if (bank) {
            setFormData({ ...bank });
        } else {
            setFormData({ name: "", accountNumber: "", branch: "", balance: 0 });
        }
        setError("");
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) {
            setShowForm(false);
            setFormData({ name: "", accountNumber: "", branch: "", balance: 0 });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const isEditing = formData.id;
            const url = "/api/banks";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save bank");
            }

            // Refresh banks
            const refreshRes = await fetch("/api/banks");
            const refreshed = await refreshRes.json();
            setBanks(refreshed);

            setSuccessMessage(isEditing ? "Bank updated successfully!" : "Bank added successfully!");
            setShowForm(false);
            setFormData({ name: "", accountNumber: "", branch: "", balance: 0 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this bank?")) return;

        try {
            const response = await fetch(`/api/banks?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete");
            }

            setBanks(prev => prev.filter(b => b.id !== id));
            setSuccessMessage("Bank deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const filteredBanks = (banks || []).filter(b => {
        const query = (searchQuery || "").toLowerCase();
        return (b.name || "").toLowerCase().includes(query) ||
            (b.accountNumber || "").includes(searchQuery || "");
    });

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }} className="font-urdu">
                            {formData.id ? "بینک تبدیل کریں" : "نیا بینک"}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading || !formData.name.trim()}
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
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">بینک کا نام</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    placeholder="نام درج کریں"
                                    required
                                    dir="rtl"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">اکاؤنٹ نمبر</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    placeholder="نمبر درج کریں"
                                    required
                                    dir="rtl"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
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
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">برانچ</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    placeholder="برانچ درج کریں"
                                    required
                                    dir="rtl"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
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
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">ابتدائی بیلنس</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    type="number"
                                    required
                                    dir="rtl"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                    variant="outlined"
                                    placeholder="بیلنس درج کریں"
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

            {/* Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search banks by name or account number..."
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
                    Add Bank
                </Button>
            </Box>

            {/* Banks Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Bank Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Account Number</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBanks.length > 0 ? (
                            filteredBanks.map((bank) => (
                                <TableRow key={bank.id} sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Landmark size={18} color="#8b5cf6" />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{bank.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>
                                            {bank.accountNumber || "N/A"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{bank.branch || "N/A"}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            Rs. {parseFloat(bank.balance).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" color="primary" onClick={() => handleOpen(bank)}><Edit size={18} /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(bank.id)}><Trash2 size={18} /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No banks found.</Typography>
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
