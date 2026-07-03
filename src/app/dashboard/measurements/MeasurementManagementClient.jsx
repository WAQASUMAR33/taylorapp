"use client";

import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, IconButton, Avatar, Box, Typography, TextField,
    Grid, CircularProgress, Alert, Snackbar, Tooltip, Tabs, Tab,
    Divider, Autocomplete, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, InputAdornment, Chip, TablePagination, LinearProgress,
} from "@mui/material";
import {
    Edit, Trash2, Search, Plus, User, Calendar, Ruler, Printer,
    Shirt, Square, MapPin, Phone,
} from "lucide-react";

// ── Urdu labels for all measurement fields ──────────────────────────────────
const SQ_QAMEEZ_FIELDS = [
    { name: "qameez_lambai", label: "قمیض لمبائی" },   // Qameez Length
    { name: "bazoo", label: "بازو" },   // Sleeve
    { name: "teera", label: "تیرہ" },   // Shoulder
    { name: "galaa", label: "گلا" },   // Neck
    { name: "chaati", label: "چھاتی" },   // Chest
    { name: "gheera", label: "گھیرا" },   // Hem
    { name: "kaf", label: "کف" },   // Cuff
    { name: "gehra_gird", label: "گہرا گرد" },   // Gehra Gird
    { name: "kandha", label: "کندھا" },   // Armhole
    { name: "chaati_around", label: "چھاتی گرد" },   // Chest Around
    { name: "kamar_around", label: "کمر گرد" },   // Waist Around
    { name: "hip_around", label: "ہپ گرد" },   // Hip Around
];

const SQ_SHALWAR_FIELDS = [
    { name: "shalwar_lambai", label: "شلوار لمبائی" },   // Shalwar Length
    { name: "puhncha", label: "پہنچا" },   // Ankle
    { name: "shalwar_gheera", label: "شلوار گھیرا" },   // Shalwar Hem
];

const WAISTCOAT_FIELDS = [
    { name: "wskot_lambai", label: "واسکٹ لمبائی" },   // Waistcoat Length
    { name: "wskot_teera", label: "تیرہ" },   // Shoulder
    { name: "wskot_gala", label: "گلا" },   // Neck
    { name: "wskot_chaati", label: "چھاتی" },   // Chest
    { name: "wskot_kamar", label: "کمر" },   // Waist
    { name: "wskot_hip", label: "ہپ" },   // Hip
];

// Blank form state
const EMPTY_FORM = {
    customerId: "",
    unit: "in",
    notes: "",
    qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "", gheera: "",
    kaf: "", gehra_gird: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "", chaati_around: "",
    kamar_around: "", hip_around: "", kandha: "",
    wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
    wskot_kamar: "", wskot_hip: "",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "—";
        const day = String(d.getDate()).padStart(2, "0");
        const month = MONTH_NAMES[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return "—";
    }
};

// ── Shared measurement field renderer ───────────────────────────────────────
function MeasureField({ field, formData, onChange }) {
    return (
        <Grid key={field.name} size={{ xs: 6, sm: 4, md: 3 }}>
            <TextField
                fullWidth
                size="small"
                type="text"
                label={
                    <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: "0.85rem", direction: "rtl" }}>
                        {field.label}
                    </span>
                }
                name={field.name}
                value={formData[field.name]}
                onChange={onChange}
                variant="outlined"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
                                {formData.unit}
                            </Typography>
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
    );
}

export default function MeasurementManagementClient({ initialMeasurements = [], initialTotalCount = 0 }) {
    const [measurements, setMeasurements] = useState(initialMeasurements || []);
    const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [listLoading, setListLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [modalTab, setModalTab] = useState(0);

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState(EMPTY_FORM);

    // Dynamic Customer Selection State
    const [customerSearch, setCustomerSearch] = useState("");
    const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
    const [customerOptions, setCustomerOptions] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Customer History State
    const [customerHistory, setCustomerHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0); // Reset page on search change
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Debounce customer search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCustomerSearch(customerSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [customerSearch]);

    // Fetch measurements with pagination & search
    useEffect(() => {
        let active = true;
        const load = async () => {
            setListLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    page: (page + 1).toString(),
                    limit: rowsPerPage.toString(),
                    search: debouncedSearch,
                });
                const res = await fetch(`/api/measurements?${queryParams.toString()}`);
                if (res.ok && active) {
                    const data = await res.json();
                    setMeasurements(data.measurements || []);
                    setTotalCount(data.totalCount || 0);
                }
            } catch (err) {
                console.error("Error fetching measurements:", err);
            } finally {
                if (active) setListLoading(false);
            }
        };

        const isInitial = page === 0 && rowsPerPage === 50 && !debouncedSearch;
        if (!isInitial || refreshTrigger > 0) {
            load();
        }

        return () => {
            active = false;
        };
    }, [page, rowsPerPage, debouncedSearch, refreshTrigger]);

    // Fetch customers dynamically when debounced search query changes
    useEffect(() => {
        let active = true;
        const fetchCustomers = async () => {
            setLoadingCustomers(true);
            try {
                const queryParams = new URLSearchParams({
                    page: "1",
                    limit: "20",
                    search: debouncedCustomerSearch,
                });
                const res = await fetch(`/api/customers?${queryParams.toString()}`);
                if (res.ok && active) {
                    const data = await res.json();
                    setCustomerOptions(data.customers || []);
                }
            } catch (err) {
                console.error("Error searching customers:", err);
            } finally {
                if (active) setLoadingCustomers(false);
            }
        };

        fetchCustomers();

        return () => {
            active = false;
        };
    }, [debouncedCustomerSearch]);

    // Fetch customer history
    useEffect(() => {
        if (!selectedCustomer) {
            setCustomerHistory([]);
            return;
        }

        let active = true;
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await fetch(`/api/measurements?customerId=${selectedCustomer.id}`);
                if (res.ok && active) {
                    const data = await res.json();
                    const filteredData = Array.isArray(data)
                        ? data.filter((item) => !editMode || item.id !== selectedId)
                        : [];
                    setCustomerHistory(filteredData);
                }
            } catch (err) {
                console.error("Error fetching customer history:", err);
            } finally {
                if (active) setLoadingHistory(false);
            }
        };

        fetchHistory();

        return () => {
            active = false;
        };
    }, [selectedCustomer, editMode, selectedId]);

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpen = (m = null) => {
        setModalTab(0);
        setCustomerHistory([]);
        if (m) {
            setEditMode(true);
            setSelectedId(m.id);
            setSelectedCustomer(m.customer);
            setFormData({
                customerId: m.customerId || "",
                unit: m.unit || "in",
                notes: m.notes || "",
                qameez_lambai: m.qameez_lambai || "",
                bazoo: m.bazoo || "",
                teera: m.teera || "",
                galaa: m.galaa || "",
                chaati: m.chaati || "",
                gheera: m.gheera || "",
                kaf: m.kaf || "",
                gehra_gird: m.gehra_gird || "",
                shalwar_lambai: m.shalwar_lambai || "",
                puhncha: m.puhncha || "",
                shalwar_gheera: m.shalwar_gheera || "",
                chaati_around: m.chaati_around || "",
                kamar_around: m.kamar_around || "",
                hip_around: m.hip_around || "",
                kandha: m.kandha || "",
                wskot_lambai: m.wskot_lambai || "",
                wskot_teera: m.wskot_teera || "",
                wskot_gala: m.wskot_gala || "",
                wskot_chaati: m.wskot_chaati || "",
                wskot_kamar: m.wskot_kamar || "",
                wskot_hip: m.wskot_hip || "",
            });
        } else {
            setEditMode(false);
            setSelectedId(null);
            setSelectedCustomer(null);
            setFormData(EMPTY_FORM);
        }
        setError("");
        setOpen(true);
    };

    const handleClose = () => { if (!loading) setOpen(false); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCopyHistory = (historyItem) => {
        setFormData({
            customerId: historyItem.customerId || "",
            unit: historyItem.unit || "in",
            notes: historyItem.notes || "",
            qameez_lambai: historyItem.qameez_lambai || "",
            bazoo: historyItem.bazoo || "",
            teera: historyItem.teera || "",
            galaa: historyItem.galaa || "",
            chaati: historyItem.chaati || "",
            gheera: historyItem.gheera || "",
            kaf: historyItem.kaf || "",
            gehra_gird: historyItem.gehra_gird || "",
            shalwar_lambai: historyItem.shalwar_lambai || "",
            puhncha: historyItem.puhncha || "",
            shalwar_gheera: historyItem.shalwar_gheera || "",
            chaati_around: historyItem.chaati_around || "",
            kamar_around: historyItem.kamar_around || "",
            hip_around: historyItem.hip_around || "",
            kandha: historyItem.kandha || "",
            wskot_lambai: historyItem.wskot_lambai || "",
            wskot_teera: historyItem.wskot_teera || "",
            wskot_gala: historyItem.wskot_gala || "",
            wskot_chaati: historyItem.wskot_chaati || "",
            wskot_kamar: historyItem.wskot_kamar || "",
            wskot_hip: historyItem.wskot_hip || "",
        });
        setSuccessMessage("Previous measurements loaded into the form!");
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedId } : formData;

            const res = await fetch("/api/measurements", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || `Failed to ${editMode ? "update" : "create"} measurement`);
            }

            setRefreshTrigger((prev) => prev + 1);
            setSuccessMessage(`Measurement ${editMode ? "updated" : "added"} successfully!`);
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const res = await fetch(`/api/measurements?id=${id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to delete");
            }
            setMeasurements((prev) => prev.filter((m) => m.id !== id));
            setTotalCount((prev) => Math.max(0, prev - 1));
            setRefreshTrigger((prev) => prev + 1);
            setSuccessMessage("Deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePrint = (measurement) => {
        const printWindow = window.open("", "_blank");
        const customerName = measurement.customer?.name || "N/A";
        const customerPhone = measurement.customer?.phone || "N/A";
        const date = formatDate(measurement.takenAt);
        const unit = measurement.unit || "in";

        const row = (label, value) => value
            ? `<div class="measurement-item"><div class="measurement-label">${label}</div><div class="measurement-value">${value} ${unit}</div></div>`
            : "";

        const printContent = `<!DOCTYPE html><html><head><title>Measurement - ${customerName}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #8b5cf6; font-size: 32px; }
            .customer-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .section { margin-bottom: 30px; }
            .section h3 { background: #8b5cf6; color: white; padding: 10px 15px; margin: 0 0 15px 0; border-radius: 5px; font-size: 18px; }
            .measurements-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 15px; }
            .measurement-item { border: 1px solid #e5e7eb; padding: 10px; border-radius: 5px; }
            .measurement-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .measurement-value { font-size: 18px; color: #1f2937; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        </style></head><body>
        <div class="header"><h1>GRACE TAILORS</h1><p>Customer Measurement Record</p></div>
        <div class="customer-info">
            <h2>Customer Information</h2>
            <div class="info-row"><strong>Name:</strong><span>${customerName}</span></div>
            <div class="info-row"><strong>Phone:</strong><span>${customerPhone}</span></div>
            <div class="info-row"><strong>Date:</strong><span>${date}</span></div>
            <div class="info-row"><strong>Unit:</strong><span>${unit === "in" ? "Inches" : "Centimeters"}</span></div>
        </div>
        ${measurement.qameez_lambai || measurement.bazoo ? `<div class="section"><h3>Shalwar Qameez</h3><div class="measurements-grid">
            ${row("قمیض لمبائی", measurement.qameez_lambai)}${row("بازو", measurement.bazoo)}
            ${row("تیرہ", measurement.teera)}${row("گلا", measurement.galaa)}
            ${row("چھاتی", measurement.chaati)}${row("گھیرا", measurement.gheera)}
            ${row("کف", measurement.kaf)}${row("کندھا", measurement.kandha)}
            ${row("گہرا گرد", measurement.gehra_gird)}${row("چھاتی گرد", measurement.chaati_around)}${row("کمر گرد", measurement.kamar_around)}
            ${row("ہپ گرد", measurement.hip_around)}${row("شلوار لمبائی", measurement.shalwar_lambai)}
            ${row("پہنچا", measurement.puhncha)}${row("شلوار گھیرا", measurement.shalwar_gheera)}
        </div></div>` : ""}
        ${measurement.wskot_lambai ? `<div class="section"><h3>Waistcoat</h3><div class="measurements-grid">
            ${row("واسکٹ لمبائی", measurement.wskot_lambai)}${row("تیرہ", measurement.wskot_teera)}
            ${row("گلا", measurement.wskot_gala)}${row("چھاتی", measurement.wskot_chaati)}
            ${row("کمر", measurement.wskot_kamar)}${row("ہپ", measurement.wskot_hip)}
        </div></div>` : ""}
        ${measurement.notes ? `<div style="background:#fef3c7;padding:15px;border-radius:8px;border-left:4px solid #f59e0b"><strong>Notes:</strong><p>${measurement.notes}</p></div>` : ""}
        <div class="footer"><p>Generated by GRACE TAILORS · ${new Date().toLocaleDateString()}</p></div>
        <script>window.onload=()=>window.print();</script>
        </body></html>`;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const filteredMeasurements = measurements || [];

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action Bar ─────────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search by Name, Phone, M#, Code, Father's Name or Booking#..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start" sx={{ color: "text.secondary", mr: 1 }}><Search size={18} /></InputAdornment>
                        ),
                    }}
                    sx={{ minWidth: 400, bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => handleOpen()}
                    sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, whiteSpace: "nowrap" }}
                >
                    Record New Measurement
                </Button>
            </Stack>

            {/* ── Measurements Table ──────────────────────────── */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", position: "relative" }}
            >
                {listLoading && (
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
                        <LinearProgress sx={{ height: 3 }} />
                    </Box>
                )}
                <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Shalwar Qameez</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Waistcoat</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMeasurements.length > 0 ? (
                            filteredMeasurements.map((m) => {
                                if (!m) return null;
                                return (
                                    <TableRow key={m.id} hover sx={{ transition: "background-color 0.15s" }}>
                                        {/* Customer */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: "0.85rem", fontWeight: 700 }}>
                                                    {(m.customer?.name || "?").charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{m.customer?.name}</Typography>
                                                    {m.customer?.fatherName && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            S/O: {m.customer.fatherName}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary" display="block">{m.customer?.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Calendar size={14} color="#9ca3af" />
                                                <Typography variant="body2">
                                                    {m.takenAt ? formatDate(m.takenAt) : "N/A"}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        {/* SQ badge */}
                                        <TableCell>
                                            {(m.qameez_lambai || m.gehra_gird)
                                                ? <Chip label="Recorded" size="small" color="success" variant="outlined" />
                                                : <Typography variant="body2" color="text.secondary">—</Typography>}
                                        </TableCell>

                                        {/* Waistcoat badge */}
                                        <TableCell>
                                            {m.wskot_lambai
                                                ? <Chip label="Recorded" size="small" color="primary" variant="outlined" />
                                                : <Typography variant="body2" color="text.secondary">—</Typography>}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="Print">
                                                    <IconButton size="small" color="primary" onClick={() => handlePrint(m)}>
                                                        <Printer size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpen(m)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                                                        <Trash2 size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Ruler size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No measurements found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[25, 50, 100]}
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            />

            {/* ── Add / Edit Measurement Dialog ────────────────── */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {editMode ? "Edit Measurement" : "Record New Measurement"}
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Customer search selection row */}
                    <Box sx={{ mb: 3 }}>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={customerOptions}
                            getOptionLabel={(o) => o ? `${o.name || ""}${o.phone ? ` (${o.phone})` : ""}` : ""}
                            value={selectedCustomer}
                            onChange={(_, newValue) => {
                                setSelectedCustomer(newValue);
                                setFormData((prev) => ({ ...prev, customerId: newValue ? newValue.id : "" }));
                            }}
                            onInputChange={(_, newInputValue) => {
                                setCustomerSearch(newInputValue);
                            }}
                            disabled={editMode}
                            loading={loadingCustomers}
                            filterOptions={(x) => x}
                            renderOption={(props, option) => option ? (
                                <Box component="li" {...props} key={option.id} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ p: 0.75, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main" }}>
                                            <User size={16} />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                            <Stack direction="row" spacing={1.5}>
                                                {option.phone && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                        <Phone size={11} color="#9ca3af" />
                                                        <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                                                    </Box>
                                                )}
                                                {option.address && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                        <MapPin size={11} color="#9ca3af" />
                                                        <Typography variant="caption" color="text.secondary">{option.address}</Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : null}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Select Customer" 
                                    variant="outlined" 
                                    required 
                                    placeholder="Search by Name, Phone, M# or Father's Name..." 
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>

                    {/* Prompt if no customer selected */}
                    {!selectedCustomer ? (
                        <Box sx={{ py: 8, textAlign: "center", bgcolor: "action.hover", borderRadius: 3, border: "2px dashed", borderColor: "divider" }}>
                            <User size={44} color="#d1d5db" />
                            <Typography color="text.secondary" variant="h6" sx={{ mt: 1 }}>Select a customer to continue</Typography>
                            <Typography color="text.secondary" variant="body2">Measurement fields and history will appear once a customer is selected.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {/* Left Side: Measurement Form */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6" fontWeight={700}>Measurement Values</Typography>
                                    <TextField
                                        select
                                        size="small"
                                        label="Unit"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        sx={{ minWidth: 150 }}
                                    >
                                        <MenuItem value="in">Inches (in)</MenuItem>
                                        <MenuItem value="cm">Centimeters (cm)</MenuItem>
                                    </TextField>
                                </Box>

                                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                                    <Tabs value={modalTab} onChange={(_, v) => setModalTab(v)}>
                                        <Tab icon={<Shirt size={17} />} iconPosition="start" label="شلوار قمیض" sx={{ fontWeight: 700 }} />
                                        <Tab icon={<Square size={17} />} iconPosition="start" label="واسکٹ" sx={{ fontWeight: 700 }} />
                                    </Tabs>
                                </Box>

                                {/* Shalwar Qameez Tab */}
                                {modalTab === 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5, borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                                            قمیض (Shirt)
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            {SQ_QAMEEZ_FIELDS.map((f) => (
                                                <MeasureField key={f.name} field={f} formData={formData} onChange={handleInputChange} />
                                            ))}
                                        </Grid>

                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5, borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                                            شلوار (Trouser)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {SQ_SHALWAR_FIELDS.map((f) => (
                                                <MeasureField key={f.name} field={f} formData={formData} onChange={handleInputChange} />
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Waistcoat Tab */}
                                {modalTab === 1 && (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5, borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                                            واسکٹ (Waistcoat)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {WAISTCOAT_FIELDS.map((f) => (
                                                <MeasureField key={f.name} field={f} formData={formData} onChange={handleInputChange} />
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                <Box sx={{ mt: 3 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Additional Notes"
                                        name="notes"
                                        placeholder="Enter any additional instructions..."
                                        multiline
                                        rows={2}
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                </Box>
                            </Grid>

                            {/* Right Side: Profile & History */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%", display: "flex", flexDirection: "column" }}>
                                    {/* Profile */}
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <User size={18} />
                                        Customer Profile
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>NAME</Typography>
                                            <Typography variant="body2" fontWeight={700}>{selectedCustomer.name}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>FATHER'S NAME</Typography>
                                            <Typography variant="body2" fontWeight={600}>{selectedCustomer.fatherName || "—"}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>MEASUREMENT NO (M#)</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{selectedCustomer.measurementNo || "—"}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>CODE</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{selectedCustomer.code || "—"}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>PHONE</Typography>
                                            <Typography variant="body2">{selectedCustomer.phone || "—"}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>CATEGORY</Typography>
                                            <Chip label={selectedCustomer.accountCategory?.name || "N/A"} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>BALANCE</Typography>
                                            <Typography variant="body2" fontWeight={700} color={parseFloat(selectedCustomer.balance) >= 0 ? "success.main" : "error.main"}>
                                                Rs. {Math.abs(parseFloat(selectedCustomer.balance || 0)).toFixed(2)}
                                                {parseFloat(selectedCustomer.balance || 0) > 0 ? " (Cr)" : parseFloat(selectedCustomer.balance || 0) < 0 ? " (Dr)" : ""}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>ADDRESS</Typography>
                                            <Typography variant="body2" color="text.primary" sx={{ bgcolor: "background.paper", p: 1, borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                                                {selectedCustomer.address || "—"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* History */}
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Calendar size={18} />
                                        Past Measurements
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />

                                    <Box sx={{ flexGrow: 1, overflowY: "auto", maxHeight: 300 }}>
                                        {loadingHistory ? (
                                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : customerHistory.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                No previous measurement records found.
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1.5} sx={{ py: 1 }}>
                                                {customerHistory.map((item) => (
                                                    <Paper key={item.id} variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper", display: "flex", flexDirection: "column", gap: 1 }}>
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {formatDate(item.takenAt)}
                                                            </Typography>
                                                            <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                                                                Unit: {item.unit}
                                                            </Typography>
                                                        </Box>
                                                        
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                                                            {[
                                                                item.qameez_lambai && `Length: ${item.qameez_lambai}`,
                                                                item.bazoo && `Bazoo: ${item.bazoo}`,
                                                                item.teera && `Teera: ${item.teera}`,
                                                                item.chaati && `Chest: ${item.chaati}`,
                                                                item.wskot_lambai && `W-Length: ${item.wskot_lambai}`,
                                                            ].filter(Boolean).join(", ")}
                                                        </Typography>

                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="secondary"
                                                            startIcon={<Ruler size={13} />}
                                                            onClick={() => handleCopyHistory(item)}
                                                            sx={{ borderRadius: 1.5, textTransform: "none", fontSize: "0.75rem", py: 0.5, mt: 0.5 }}
                                                        >
                                                            Use These Values
                                                        </Button>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !formData.customerId}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading
                            ? <CircularProgress size={20} color="inherit" />
                            : editMode ? "Update Measurement" : "Save Measurement"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ───────────────────────────── */}
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
