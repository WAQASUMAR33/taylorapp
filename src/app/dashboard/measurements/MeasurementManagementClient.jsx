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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Tooltip,
    Tabs,
    Tab,
    Divider,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X,
    User,
    Calendar,
    Ruler,
    Printer,
    Shirt,
    Square,
    Languages
} from "lucide-react";

const translations = {
    // Labels
    selectCustomer: { en: "Select Customer", ur: "گاہک منتخب کریں" },
    unit: { en: "Unit", ur: "اکائی" },
    inches: { en: "Inches (in)", ur: "انچ" },
    centimeters: { en: "Centimeters (cm)", ur: "سینٹی میٹر" },
    pleaseSelectCustomer: { en: "Please select a customer first", ur: "براہ کرم پہلے گاہک منتخب کریں" },
    measurementFieldsAppear: { en: "Measurement fields will appear once a customer is selected.", ur: "پیمائش کے خانے گاہک کے انتخاب کے بعد ظاہر ہوں گے۔" },
    additionalNotes: { en: "Additional Notes", ur: "اضافی نوٹ" },
    cancel: { en: "Cancel", ur: "منسوخ کریں" },
    save: { en: "Save", ur: "محفوظ کریں" },
    update: { en: "Update", ur: "اپ ڈیٹ کریں" },

    // Tabs
    shalwarQameez: { en: "Shalwar Qameez", ur: "شلوار قمیض" },
    qameez: { en: "Qameez", ur: "قمیض" },
    shalwar: { en: "Shalwar", ur: "شلوار" },
    waistcoat: { en: "Waistcoat (Wskot)", ur: "واسکٹ" },

    // Fields - SQ
    qameez_lambai: { en: "Qameez Lambai", ur: "قمیض لمبائی" },
    bazoo: { en: "Bazoo", ur: "بازو" },
    teera: { en: "Teera", ur: "تیرا" },
    galaa: { en: "Galaa", ur: "گلا" },
    chaati: { en: "Chaati", ur: "چھاتی" },
    gheera: { en: "Gheera", ur: "گھیرا" },
    kaf: { en: "Kaf", ur: "کف" },
    shalwar_lambai: { en: "Shalwar Lambai", ur: "شلوار لمبائی" },
    puhncha: { en: "Puhncha", ur: "پانچا" },
    shalwar_gheera: { en: "Shalwar Gheera", ur: "شلوار گھیرا" },
    chaati_around: { en: "Chaati Around", ur: "چھاتی (گول)" },
    kamar_around: { en: "Kamar Around", ur: "کمر (گول)" },
    hip_around: { en: "Hip Around", ur: "ہپ (گول)" },
    kandha: { en: "Kandha", ur: "کندھا" },

    // Fields - Wskot
    wskot_lambai: { en: "Lambai", ur: "لمبائی" },
    wskot_teera: { en: "Teera", ur: "تیرا" },
    wskot_gala: { en: "Gala", ur: "گلا" },
    wskot_chaati: { en: "Chaati", ur: "چھاتی" },
    wskot_kamar: { en: "Kamar", ur: "کمر" },
    wskot_hip: { en: "Hip", ur: "ہپ" },
};

export default function MeasurementManagementClient({ initialMeasurements, customers }) {
    const [measurements, setMeasurements] = useState(initialMeasurements);
    const [searchQuery, setSearchQuery] = useState("");
    const [modalTab, setModalTab] = useState(0); // 0 for Shalwar Qameez, 1 for Wskot
    const [language, setLanguage] = useState("en");

    // UI States
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        customerId: "",
        unit: "in",
        notes: "",
        // SQ
        qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "", gheera: "", kaf: "",
        shalwar_lambai: "", puhncha: "", shalwar_gheera: "", chaati_around: "", kamar_around: "",
        hip_around: "", kandha: "",
        // Wskot
        wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "", wskot_kamar: "", wskot_hip: ""
    });

    const t = (key) => translations[key]?.[language] || key;

    const handleOpen = (m = null) => {
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
                wskot_hip: m.wskot_hip || ""
            });
        } else {
            setEditMode(false);
            setSelectedId(null);
            setFormData({
                customerId: "",
                unit: "in",
                notes: "",
                qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "", gheera: "", kaf: "",
                shalwar_lambai: "", puhncha: "", shalwar_gheera: "", chaati_around: "", kamar_around: "",
                hip_around: "", kandha: "",
                wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "", wskot_kamar: "", wskot_hip: ""
            });
        }
        setError("");
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
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
            const payload = editMode ? { ...formData, id: selectedId } : formData;

            const response = await fetch("/api/measurements", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? 'update' : 'create'} measurement`);
            }

            // Refresh
            const refreshRes = await fetch("/api/measurements");
            const refreshed = await refreshRes.json();
            setMeasurements(refreshed);

            setSuccessMessage(`Measurement ${editMode ? 'updated' : 'added'} successfully!`);
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
            const response = await fetch(`/api/measurements?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete");
            }

            setMeasurements(prev => prev.filter(m => m.id !== id));
            setSuccessMessage("Deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePrint = (measurement) => {
        const printWindow = window.open('', '_blank');
        const customerName = measurement.customer?.name || 'N/A';
        const customerPhone = measurement.customer?.phone || 'N/A';
        const date = new Date(measurement.takenAt).toLocaleDateString();
        const unit = measurement.unit || 'in';

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Measurement - ${customerName}</title>
                <style>
                    @media print {
                        @page { margin: 0.5in; }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #8b5cf6;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        color: #8b5cf6;
                        font-size: 32px;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .customer-info {
                        background: #f9fafb;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .customer-info h2 {
                        margin: 0 0 10px 0;
                        color: #1f2937;
                        font-size: 20px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .section {
                        margin-bottom: 30px;
                    }
                    .section h3 {
                        background: #8b5cf6;
                        color: white;
                        padding: 10px 15px;
                        margin: 0 0 15px 0;
                        border-radius: 5px;
                        font-size: 18px;
                    }
                    .measurements-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                    }
                    .measurement-item {
                        border: 1px solid #e5e7eb;
                        padding: 10px;
                        border-radius: 5px;
                        background: white;
                    }
                    .measurement-label {
                        font-weight: bold;
                        color: #6b7280;
                        font-size: 12px;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .measurement-value {
                        font-size: 18px;
                        color: #1f2937;
                        font-weight: 600;
                    }
                    .notes {
                        background: #fef3c7;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #f59e0b;
                    }
                    .notes h4 {
                        margin: 0 0 10px 0;
                        color: #92400e;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 12px;
                    }
                    .no-data {
                        color: #9ca3af;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>TailorFlow</h1>
                    <p>Customer Measurement Record</p>
                </div>

                <div class="customer-info">
                    <h2>Customer Information</h2>
                    <div class="info-row">
                        <strong>Name:</strong>
                        <span>${customerName}</span>
                    </div>
                    <div class="info-row">
                        <strong>Phone:</strong>
                        <span>${customerPhone}</span>
                    </div>
                    <div class="info-row">
                        <strong>Date Taken:</strong>
                        <span>${date}</span>
                    </div>
                    <div class="info-row">
                        <strong>Unit:</strong>
                        <span>${unit === 'in' ? 'Inches' : 'Centimeters'}</span>
                    </div>
                </div>

                ${measurement.qameez_lambai || measurement.bazoo || measurement.teera ? `
                <div class="section">
                    <h3>Shalwar Qameez Measurements</h3>
                    <div class="measurements-grid">
                        ${measurement.qameez_lambai ? `<div class="measurement-item"><div class="measurement-label">Qameez Lambai</div><div class="measurement-value">${measurement.qameez_lambai} ${unit}</div></div>` : ''}
                        ${measurement.bazoo ? `<div class="measurement-item"><div class="measurement-label">Bazoo</div><div class="measurement-value">${measurement.bazoo} ${unit}</div></div>` : ''}
                        ${measurement.teera ? `<div class="measurement-item"><div class="measurement-label">Teera</div><div class="measurement-value">${measurement.teera} ${unit}</div></div>` : ''}
                        ${measurement.galaa ? `<div class="measurement-item"><div class="measurement-label">Galaa</div><div class="measurement-value">${measurement.galaa} ${unit}</div></div>` : ''}
                        ${measurement.chaati ? `<div class="measurement-item"><div class="measurement-label">Chaati</div><div class="measurement-value">${measurement.chaati} ${unit}</div></div>` : ''}
                        ${measurement.gheera ? `<div class="measurement-item"><div class="measurement-label">Gheera</div><div class="measurement-value">${measurement.gheera} ${unit}</div></div>` : ''}
                        ${measurement.kaf ? `<div class="measurement-item"><div class="measurement-label">Kaf</div><div class="measurement-value">${measurement.kaf} ${unit}</div></div>` : ''}
                        ${measurement.shalwar_lambai ? `<div class="measurement-item"><div class="measurement-label">Shalwar Lambai</div><div class="measurement-value">${measurement.shalwar_lambai} ${unit}</div></div>` : ''}
                        ${measurement.puhncha ? `<div class="measurement-item"><div class="measurement-label">Puhncha</div><div class="measurement-value">${measurement.puhncha} ${unit}</div></div>` : ''}
                        ${measurement.shalwar_gheera ? `<div class="measurement-item"><div class="measurement-label">Shalwar Gheera</div><div class="measurement-value">${measurement.shalwar_gheera} ${unit}</div></div>` : ''}
                        ${measurement.chaati_around ? `<div class="measurement-item"><div class="measurement-label">Chaati Around</div><div class="measurement-value">${measurement.chaati_around} ${unit}</div></div>` : ''}
                        ${measurement.kamar_around ? `<div class="measurement-item"><div class="measurement-label">Kamar Around</div><div class="measurement-value">${measurement.kamar_around} ${unit}</div></div>` : ''}
                        ${measurement.hip_around ? `<div class="measurement-item"><div class="measurement-label">Hip Around</div><div class="measurement-value">${measurement.hip_around} ${unit}</div></div>` : ''}
                        ${measurement.kandha ? `<div class="measurement-item"><div class="measurement-label">Kandha</div><div class="measurement-value">${measurement.kandha} ${unit}</div></div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${measurement.wskot_lambai || measurement.wskot_teera || measurement.wskot_gala ? `
                <div class="section">
                    <h3>Waistcoat (Wskot) Measurements</h3>
                    <div class="measurements-grid">
                        ${measurement.wskot_lambai ? `<div class="measurement-item"><div class="measurement-label">Lambai</div><div class="measurement-value">${measurement.wskot_lambai} ${unit}</div></div>` : ''}
                        ${measurement.wskot_teera ? `<div class="measurement-item"><div class="measurement-label">Teera</div><div class="measurement-value">${measurement.wskot_teera} ${unit}</div></div>` : ''}
                        ${measurement.wskot_gala ? `<div class="measurement-item"><div class="measurement-label">Gala</div><div class="measurement-value">${measurement.wskot_gala} ${unit}</div></div>` : ''}
                        ${measurement.wskot_chaati ? `<div class="measurement-item"><div class="measurement-label">Chaati</div><div class="measurement-value">${measurement.wskot_chaati} ${unit}</div></div>` : ''}
                        ${measurement.wskot_kamar ? `<div class="measurement-item"><div class="measurement-label">Kamar</div><div class="measurement-value">${measurement.wskot_kamar} ${unit}</div></div>` : ''}
                        ${measurement.wskot_hip ? `<div class="measurement-item"><div class="measurement-label">Hip</div><div class="measurement-value">${measurement.wskot_hip} ${unit}</div></div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${measurement.notes ? `
                <div class="notes">
                    <h4>Additional Notes</h4>
                    <p>${measurement.notes}</p>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Generated by TailorFlow on ${new Date().toLocaleDateString()}</p>
                    <p>This is an official measurement record</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const filteredMeasurements = measurements.filter(m =>
        m.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.customer?.phone?.includes(searchQuery)
    );

    return (
        <Box sx={{ width: '100%' }}>
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search by customer name or phone..."
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
                    Add Measurement
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date Taken</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Shalwar Qameez</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Waistcoat</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMeasurements.length > 0 ? (
                            filteredMeasurements.map((m) => (
                                <TableRow
                                    key={m.id}
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
                                                <User size={20} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {m.customer?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {m.customer?.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Calendar size={14} className="text-zinc-400" />
                                            <Typography variant="body2">
                                                {new Date(m.takenAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {m.qameez_lambai ? (
                                            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>
                                                Recorded
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">None</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {m.wskot_lambai ? (
                                            <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 500 }}>
                                                Recorded
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">None</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Print Measurement">
                                                <IconButton size="small" sx={{ color: '#8b5cf6' }} onClick={() => handlePrint(m)}>
                                                    <Printer size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" color="primary" onClick={() => handleOpen(m)}>
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(m.id)}
                                            >
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No measurements found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog */}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    pb: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {editMode ? "Edit Measurement" : "Add New Measurement"}
                        <ToggleButtonGroup
                            value={language}
                            exclusive
                            onChange={(e, newLang) => {
                                if (newLang) setLanguage(newLang);
                            }}
                            size="small"
                            sx={{
                                height: 32,
                                '& .MuiToggleButton-root': {
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }
                            }}
                        >
                            <ToggleButton value="en">English</ToggleButton>
                            <ToggleButton value="ur" sx={{ fontFamily: 'Noto Nastaliq Urdu, Arial' }}>اردو</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <IconButton onClick={handleClose} disabled={loading}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Grid container spacing={3} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{t('selectCustomer')}</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    name="customerId"
                                    required
                                    value={formData.customerId}
                                    onChange={handleInputChange}
                                    disabled={editMode}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                >
                                    {customers.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name} ({c.phone})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {formData.customerId && (
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{t('unit')}</Typography>
                                    <TextField
                                        fullWidth
                                        select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'white',
                                                borderRadius: '10px',
                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                '&:hover fieldset': { borderColor: '#3b82f6' },
                                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                            }
                                        }}
                                    >
                                        <MenuItem value="in">{t('inches')}</MenuItem>
                                        <MenuItem value="cm">{t('centimeters')}</MenuItem>
                                    </TextField>
                                </Grid>
                            )}
                        </Grid>

                        {!formData.customerId ? (
                            <Box sx={{
                                py: 8,
                                textAlign: 'center',
                                bgcolor: '#f9fafb',
                                borderRadius: 2,
                                border: '2px dashed #e5e7eb'
                            }}>
                                <User size={48} className="text-zinc-300 mb-2 mx-auto" />
                                <Typography color="textSecondary" variant="h6">
                                    {t('pleaseSelectCustomer')}
                                </Typography>
                                <Typography color="textSecondary" variant="body2">
                                    {t('measurementFieldsAppear')}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                    <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} aria-label="measurement tabs">
                                        <Tab icon={<Shirt size={18} />} iconPosition="start" label={t('shalwarQameez')} />
                                        <Tab icon={<Square size={18} />} iconPosition="start" label={t('waistcoat')} />
                                    </Tabs>
                                </Box>

                                {modalTab === 0 && (
                                    <Box sx={{ p: 1 }}>
                                        {/* Qameez Section */}
                                        <Typography variant="subtitle2" sx={{
                                            fontWeight: 700,
                                            mb: 2,
                                            mt: 1,
                                            color: '#8b5cf6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            borderBottom: '1px solid #f3f4f6',
                                            pb: 1
                                        }}>
                                            {t('qameez')}
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mb: 4 }}>
                                            {[
                                                { name: 'qameez_lambai', label: 'qameez_lambai' },
                                                { name: 'bazoo', label: 'bazoo' },
                                                { name: 'teera', label: 'teera' },
                                                { name: 'galaa', label: 'galaa' },
                                                { name: 'chaati', label: 'chaati' },
                                                { name: 'gheera', label: 'gheera' },
                                                { name: 'kaf', label: 'kaf' },
                                                { name: 'kandha', label: 'kandha' },
                                                { name: 'chaati_around', label: 'chaati_around' },
                                                { name: 'kamar_around', label: 'kamar_around' },
                                                { name: 'hip_around', label: 'hip_around' },
                                            ].map((field) => (
                                                <Grid item xs={6} sm={4} md={3} key={field.name}>
                                                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 600, color: '#4b5563', display: 'block' }}>{t(field.label)}</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        name={field.name}
                                                        value={formData[field.name]}
                                                        onChange={handleInputChange}
                                                        variant="outlined"
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                borderRadius: '8px',
                                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                                '&:hover fieldset': { borderColor: '#3b82f6' },
                                                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>

                                        {/* Shalwar Section */}
                                        <Typography variant="subtitle2" sx={{
                                            fontWeight: 700,
                                            mb: 2,
                                            color: '#8b5cf6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            borderBottom: '1px solid #f3f4f6',
                                            pb: 1
                                        }}>
                                            {t('shalwar')}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {[
                                                { name: 'shalwar_lambai', label: 'shalwar_lambai' },
                                                { name: 'puhncha', label: 'puhncha' },
                                                { name: 'shalwar_gheera', label: 'shalwar_gheera' },
                                            ].map((field) => (
                                                <Grid item xs={6} sm={4} md={3} key={field.name}>
                                                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 600, color: '#4b5563', display: 'block' }}>{t(field.label)}</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        name={field.name}
                                                        value={formData[field.name]}
                                                        onChange={handleInputChange}
                                                        variant="outlined"
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                borderRadius: '8px',
                                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                                '&:hover fieldset': { borderColor: '#3b82f6' },
                                                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                {modalTab === 1 && (
                                    <Box sx={{ p: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Ruler size={18} /> {t('waistcoat')}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {[
                                                { name: 'wskot_lambai', label: 'wskot_lambai' },
                                                { name: 'wskot_teera', label: 'wskot_teera' },
                                                { name: 'wskot_gala', label: 'wskot_gala' },
                                                { name: 'wskot_chaati', label: 'wskot_chaati' },
                                                { name: 'wskot_kamar', label: 'wskot_kamar' },
                                                { name: 'wskot_hip', label: 'wskot_hip' },
                                            ].map((field) => (
                                                <Grid item xs={6} sm={4} md={3} key={field.name}>
                                                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 600, color: '#4b5563', display: 'block' }}>{t(field.label)}</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        name={field.name}
                                                        value={formData[field.name]}
                                                        onChange={handleInputChange}
                                                        variant="outlined"
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                borderRadius: '8px',
                                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                                '&:hover fieldset': { borderColor: '#3b82f6' },
                                                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                            {t('additionalNotes')}
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        name="notes"
                                        placeholder="e.g. Loose fitting, specific collar style, or urgent delivery..."
                                        multiline
                                        rows={3}
                                        value={formData.notes}
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
                                </Box>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                bgcolor: '#8b5cf6',
                                '&:hover': { bgcolor: '#7c3aed' }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (editMode ? t('update') : t('save'))}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
            >
                <Alert severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
            </Snackbar>
        </Box>
    );
}
