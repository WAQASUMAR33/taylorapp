"use client";

import { useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, IconButton, Avatar, Box, Typography, TextField,
    InputAdornment, Grid, CircularProgress, Alert, Snackbar, Switch,
    FormControlLabel, Autocomplete, Dialog, DialogTitle, DialogContent,
    DialogActions, Chip, Tooltip, Stack,
} from "@mui/material";
import {
    Briefcase, X as XIcon, Search, Trash2, Edit,
    Phone, MapPin, Save, UserPlus, Users,
} from "lucide-react";

const EMPLOYEE_ROLES = ["Tailor", "Cutter"];

const EMPTY_FORM = {
    name: "", fatherName: "", role: "", phone: "",
    address: "", salary: "", isActive: true,
};

export default function EmployeeManagementClient({ initialEmployees }) {
    const [employees, setEmployees] = useState(initialEmployees);
    const [searchQuery, setSearchQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedEmpId, setSelectedEmpId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState(EMPTY_FORM);

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
                isActive: emp.isActive ?? true,
            });
        } else {
            setEditMode(false);
            setSelectedEmpId(null);
            setFormData(EMPTY_FORM);
        }
        setError("");
        setOpen(true);
    };

    const handleClose = () => { if (!loading) setOpen(false); };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
                throw new Error(data.error || `Failed to ${editMode ? "update" : "create"} employee`);
            }

            const savedEmp = await response.json();
            const serialized = { ...savedEmp, salary: savedEmp.salary ? savedEmp.salary.toString() : "0" };

            if (editMode) {
                setEmployees(prev => prev.map(e => e.id === selectedEmpId ? serialized : e));
                setSuccessMessage("Employee updated successfully!");
            } else {
                setEmployees(prev => [serialized, ...prev]);
                setSuccessMessage("Employee added successfully!");
            }
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        try {
            const response = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
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
        const q = (searchQuery || "").toLowerCase();
        return (emp.name || "").toLowerCase().includes(q) ||
            (emp.role || "").toLowerCase().includes(q);
    });

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action Bar ──────────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search by name or role..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                    sx={{ minWidth: 300, bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={() => handleOpen()}
                    sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, whiteSpace: "nowrap" }}
                >
                    Add New Employee
                </Button>
            </Stack>

            {/* ── Employees Table ─────────────────────────────── */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Salary</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <TableRow key={emp.id} hover sx={{ transition: "background-color 0.15s" }}>

                                    {/* Employee name + father name */}
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600}>{emp.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Father: {emp.fatherName || "N/A"}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Role */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Briefcase size={14} color="#9ca3af" />
                                            <Typography variant="body2">{emp.role}</Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Contact */}
                                    <TableCell>
                                        <Stack spacing={0.5}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <Phone size={13} color="#9ca3af" />
                                                <Typography variant="caption">{emp.phone || "No Number"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <MapPin size={13} color="#9ca3af" />
                                                <Typography variant="caption" sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {emp.address || "No Address"}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    {/* Salary */}
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} color="success.main">
                                            Rs. {parseFloat(emp.salary || 0).toLocaleString()}
                                        </Typography>
                                    </TableCell>

                                    {/* Status chip */}
                                    <TableCell>
                                        <Chip
                                            label={emp.isActive ? "Active" : "Inactive"}
                                            size="small"
                                            color={emp.isActive ? "success" : "default"}
                                            variant="outlined"
                                        />
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleOpen(emp)}
                                                    sx={{ bgcolor: '#3b82f6', color: 'white', borderRadius: 1.5, '&:hover': { bgcolor: '#2563eb' } }}>
                                                    <Edit size={15} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(emp.id)}
                                                    sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: 1.5, '&:hover': { bgcolor: '#dc2626' } }}>
                                                    <Trash2 size={15} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Users size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No employees found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Add / Edit Employee Dialog ───────────────────── */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {editMode ? "Edit Employee Details" : "Add New Employee"}
                </DialogTitle>

                <DialogContent sx={{ pt: '24px !important', pb: 3 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>

                        {/* Row 1: Name | Father's Name | Role */}
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Full Name"
                                name="name"
                                required
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Father's Name"
                                name="fatherName"
                                placeholder="Enter father's name"
                                value={formData.fatherName}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={4}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={EMPLOYEE_ROLES}
                                value={formData.role || null}
                                onChange={(_, newValue) =>
                                    setFormData(prev => ({ ...prev, role: newValue || "" }))
                                }
                                componentsProps={{
                                    paper: { sx: { minWidth: 300 } }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Role" required placeholder="Select role" variant="outlined" />
                                )}
                            />
                        </Grid>

                        {/* Row 2: Phone | Salary | Status */}
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phone Number"
                                name="phone"
                                placeholder="03xx-xxxxxxx"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone size={16} color="#9ca3af" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Monthly Salary"
                                name="salary"
                                type="number"
                                required
                                placeholder="0"
                                value={formData.salary}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                }}
                            />
                        </Grid>

                        <Grid item xs={4}>
                            <Box
                                sx={{
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    px: 1.5,
                                }}
                            >
                                <FormControlLabel
                                    sx={{ m: 0, gap: 1 }}
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            name="isActive"
                                            color="success"
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" fontWeight={600}>
                                            {formData.isActive ? "Active" : "Inactive"}
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Grid>

                        {/* Row 3: Home Address — full width */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Home Address"
                                name="address"
                                placeholder="Enter full address"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                            <MapPin size={16} color="#9ca3af" />
                                        </InputAdornment>
                                    ),
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
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : editMode ? "Update Employee" : "Save Employee"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ──────────────────────────────── */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
