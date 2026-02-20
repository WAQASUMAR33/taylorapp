"use client";

import { useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, IconButton, Avatar, Box, Typography, TextField,
    Grid, CircularProgress, Alert, Snackbar, Tooltip, Tabs, Tab,
    Divider, Autocomplete, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, InputAdornment, Chip,
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
    kaf: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "", chaati_around: "",
    kamar_around: "", hip_around: "", kandha: "",
    wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
    wskot_kamar: "", wskot_hip: "",
};

// ── Shared measurement field renderer ───────────────────────────────────────
function MeasureField({ field, formData, onChange }) {
    return (
        <Grid item xs={6} sm={4} md={3} key={field.name}>
            <TextField
                fullWidth
                size="small"
                type="number"
                label={
                    <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: "0.85rem", direction: "rtl" }}>
                        {field.label}
                    </span>
                }
                name={field.name}
                value={formData[field.name]}
                onChange={onChange}
                variant="outlined"
                inputProps={{ min: 0, step: "0.5" }}
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

export default function MeasurementManagementClient({ initialMeasurements = [], customers = [] }) {
    const [measurements, setMeasurements] = useState(initialMeasurements || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [modalTab, setModalTab] = useState(0);

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState(EMPTY_FORM);

    const handleOpen = (m = null) => {
        setModalTab(0);
        if (m) {
            setEditMode(true);
            setSelectedId(m.id);
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

            const refreshRes = await fetch("/api/measurements");
            const refreshed = await refreshRes.json();
            if (Array.isArray(refreshed)) setMeasurements(refreshed);

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
            setSuccessMessage("Deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePrint = (measurement) => {
        const printWindow = window.open("", "_blank");
        const customerName = measurement.customer?.name || "N/A";
        const customerPhone = measurement.customer?.phone || "N/A";
        const date = new Date(measurement.takenAt).toLocaleDateString();
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
        <div class="header"><h1>TailorFlow</h1><p>Customer Measurement Record</p></div>
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
            ${row("چھاتی گرد", measurement.chaati_around)}${row("کمر گرد", measurement.kamar_around)}
            ${row("ہپ گرد", measurement.hip_around)}${row("شلوار لمبائی", measurement.shalwar_lambai)}
            ${row("پہنچا", measurement.puhncha)}${row("شلوار گھیرا", measurement.shalwar_gheera)}
        </div></div>` : ""}
        ${measurement.wskot_lambai ? `<div class="section"><h3>Waistcoat</h3><div class="measurements-grid">
            ${row("واسکٹ لمبائی", measurement.wskot_lambai)}${row("تیرہ", measurement.wskot_teera)}
            ${row("گلا", measurement.wskot_gala)}${row("چھاتی", measurement.wskot_chaati)}
            ${row("کمر", measurement.wskot_kamar)}${row("ہپ", measurement.wskot_hip)}
        </div></div>` : ""}
        ${measurement.notes ? `<div style="background:#fef3c7;padding:15px;border-radius:8px;border-left:4px solid #f59e0b"><strong>Notes:</strong><p>${measurement.notes}</p></div>` : ""}
        <div class="footer"><p>Generated by TailorFlow · ${new Date().toLocaleDateString()}</p></div>
        <script>window.onload=()=>window.print();</script>
        </body></html>`;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const filteredMeasurements = (measurements || []).filter((m) => {
        if (!m) return false;
        const q = (searchQuery || "").toLowerCase();
        const name = (m.customer?.name || "").toLowerCase();
        const phone = String(m.customer?.phone || "");
        return name.includes(q) || phone.includes(searchQuery || "");
    });

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action Bar ─────────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search by customer name or phone..."
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
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
            >
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
                                                    <Typography variant="caption" color="text.secondary" display="block">{m.customer?.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Calendar size={14} color="#9ca3af" />
                                                <Typography variant="body2">
                                                    {m.takenAt ? new Date(m.takenAt).toLocaleDateString() : "N/A"}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        {/* SQ badge */}
                                        <TableCell>
                                            {m.qameez_lambai
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

                    {/* Customer & Unit row */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={customers || []}
                                getOptionLabel={(o) => o ? `${o.name || ""}${o.phone ? ` (${o.phone})` : ""}` : ""}
                                value={(customers || []).find((c) => c && c.id === formData.customerId) || null}
                                onChange={(_, newValue) =>
                                    setFormData((prev) => ({ ...prev, customerId: newValue ? newValue.id : "" }))
                                }
                                disabled={editMode}
                                sx={{ minWidth: 300 }}
                                ListboxProps={{ style: { minWidth: 300 } }}
                                filterOptions={(options, { inputValue }) => {
                                    const q = (inputValue || "").toLowerCase();
                                    return (options || []).filter((o) =>
                                        o && ((o.name || "").toLowerCase().includes(q) || String(o.phone || "").includes(q))
                                    );
                                }}
                                renderOption={(props, option) => option ? (
                                    <Box component="li" {...props} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}>
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
                                    <TextField {...params} label="Select Customer" variant="outlined" required placeholder="Search customer..." />
                                )}
                            />
                        </Grid>

                        {formData.customerId && (
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
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
                            </Grid>
                        )}
                    </Grid>

                    {/* Prompt if no customer selected */}
                    {!formData.customerId ? (
                        <Box sx={{ py: 8, textAlign: "center", bgcolor: "action.hover", borderRadius: 3, border: "2px dashed", borderColor: "divider" }}>
                            <User size={44} color="#d1d5db" />
                            <Typography color="text.secondary" variant="h6" sx={{ mt: 1 }}>Select a customer to continue</Typography>
                            <Typography color="text.secondary" variant="body2">Measurement fields will appear once a customer is selected.</Typography>
                        </Box>
                    ) : (
                        <>
                            <Divider sx={{ my: 2 }} />

                            {/* Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                                <Tabs value={modalTab} onChange={(_, v) => setModalTab(v)}>
                                    <Tab icon={<Shirt size={17} />} iconPosition="start" label="شلوار قمیض" sx={{ fontWeight: 700 }} />
                                    <Tab icon={<Square size={17} />} iconPosition="start" label="واسکٹ" sx={{ fontWeight: 700 }} />
                                </Tabs>
                            </Box>

                            {/* ── Shalwar Qameez Tab ─────────────────── */}
                            {modalTab === 0 && (
                                <Box>
                                    {/* Qameez section */}
                                    <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5, borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                                        قمیض (Shirt)
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        {SQ_QAMEEZ_FIELDS.map((f) => (
                                            <MeasureField key={f.name} field={f} formData={formData} onChange={handleInputChange} />
                                        ))}
                                    </Grid>

                                    {/* Shalwar section */}
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

                            {/* ── Waistcoat Tab ──────────────────────── */}
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

                            {/* Notes */}
                            <Box sx={{ mt: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Additional Notes"
                                    name="notes"
                                    placeholder="Enter any additional instructions..."
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                />
                            </Box>
                        </>
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
