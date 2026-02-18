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
    Avatar,
    Box,
    Typography,
    TextField,
    InputAdornment,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Switch,
    FormControlLabel,
    Autocomplete,
    Card
} from "@mui/material";
import {
    Briefcase,
    X as XIcon,
    User,
    Users,
    Hash,
    Plus,
    Search,
    Trash2,
    Edit,
    Phone,
    MapPin,
    Save,
    UserPlus
} from "lucide-react";

const employeeRoles = [
    "Tailor",
    "Cutter"
];

export default function EmployeeManagementClient({ initialEmployees }) {
    const [employees, setEmployees] = useState(initialEmployees);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedEmpId, setSelectedEmpId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        role: "",
        phone: "",
        address: "",
        salary: "",
        isActive: true
    });

    const handleOpen = (emp = null) => {
        if (emp) {
            setEditMode(true);
            setSelectedEmpId(emp.id);
            setFormData({
                name: emp.name || "",
                fatherName: emp.fatherName || "",
                role: emp.role || "",
                phone: emp.phone || "",
                address: emp.address || "",
                salary: emp.salary || "",
                isActive: emp.isActive ?? true
            });
        } else {
            setEditMode(false);
            setSelectedEmpId(null);
            setFormData({
                name: "",
                fatherName: "",
                role: "",
                phone: "",
                address: "",
                salary: "",
                isActive: true
            });
        }
        setError("");
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) {
            setShowForm(false);
            setEditMode(false);
            setSelectedEmpId(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedEmpId } : formData;

            const response = await fetch("/api/employees", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? 'update' : 'create'} employee`);
            }

            const savedEmp = await response.json();

            // Serialize for local state
            const serializedEmp = {
                ...savedEmp,
                salary: savedEmp.salary ? savedEmp.salary.toString() : "0"
            };

            if (editMode) {
                setEmployees(prev => prev.map(e => e.id === selectedEmpId ? serializedEmp : e));
                setSuccessMessage("Employee updated successfully!");
            } else {
                setEmployees(prev => [serializedEmp, ...prev]);
                setSuccessMessage("Employee added successfully!");
            }

            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;

        try {
            const response = await fetch(`/api/employees?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete employee");
            }

            setEmployees(prev => prev.filter(e => e.id !== id));
            setSuccessMessage("Employee deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredEmployees = (employees || []).filter(emp => {
        const query = (searchQuery || "").toLowerCase();
        return (emp.name || "").toLowerCase().includes(query) ||
            (emp.role || "").toLowerCase().includes(query);
    });

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }} className="font-urdu">
                            {editMode ? "ملازم کی معلومات تبدیل کریں" : "نیا ملازم شامل کریں"}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "محفوظ کریں"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<XIcon size={18} />}
                                onClick={handleClose}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                کینسل
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">مکمل نام</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="name"
                                    required
                                    dir="rtl"
                                    placeholder="نام درج کریں"
                                    value={formData.name}
                                    onChange={handleInputChange}
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
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">والد کا نام</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="fatherName"
                                    required
                                    dir="rtl"
                                    placeholder="والد کا نام درج کریں"
                                    value={formData.fatherName}
                                    onChange={handleInputChange}
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
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">عہدہ</Typography>
                                </Box>
                                <Autocomplete
                                    options={employeeRoles}
                                    value={formData.role || null}
                                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, role: newValue || '' }))}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            required
                                            dir="rtl"
                                            placeholder="عہدہ منتخب کریں"
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
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">فون نمبر</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    required
                                    dir="rtl"
                                    placeholder="فون نمبر درج کریں"
                                    value={formData.phone}
                                    onChange={handleInputChange}
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
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">تنخواہ (ماہانہ)</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="salary"
                                    required
                                    type="number"
                                    dir="rtl"
                                    placeholder="تنخواہ درج کریں"
                                    value={formData.salary}
                                    onChange={handleInputChange}
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
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">سٹیٹس</Typography>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    p: 1.5,
                                    bgcolor: 'white',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    height: '56px'
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                name="isActive"
                                                color="primary"
                                            />
                                        }
                                        label={formData.isActive ? "ایکٹیو" : "ان ایکٹیو"}
                                        labelPlacement="start"
                                        sx={{ mr: 1, '& .MuiFormControlLabel-label': { fontWeight: 500, color: '#374151' } }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937' }} className="font-urdu">گھر کا پتہ</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="address"
                                    required
                                    dir="rtl"
                                    placeholder="پتہ درج کریں"
                                    multiline
                                    rows={4}
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
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
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search employees by name or role..."
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
                    startIcon={<UserPlus size={18} />}
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
                    Add Employee
                </Button>
            </Box>

            {/* Employees Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <TableRow
                                    key={emp.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{
                                                bgcolor: '#f5f3ff',
                                                color: '#8b5cf6',
                                                fontWeight: 'bold'
                                            }}>
                                                {emp.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {emp.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Father: {emp.fatherName || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Briefcase size={14} className="text-zinc-400" />
                                            <Typography variant="body2">{emp.role}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                                            Rs. {parseFloat(emp.salary).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: emp.isActive ? '#10b981' : '#ef4444'
                                            }} />
                                            <Typography variant="body2">
                                                {emp.isActive ? 'Active' : 'Inactive'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Phone size={14} className="text-zinc-400" />
                                                <Typography variant="caption">{emp.phone || 'No phone'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MapPin size={14} className="text-zinc-400" />
                                                <Typography variant="caption" sx={{
                                                    maxWidth: 150,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {emp.address || 'No address'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" color="primary" onClick={() => handleOpen(emp)}>
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)}>
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No employees found.</Typography>
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
