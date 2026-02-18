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
    ToggleButtonGroup,
    Autocomplete
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
    Languages,
    MapPin,
    Phone
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
    const [language, setLanguage] = useState("ur");

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

    const filteredMeasurements = (measurements || []).filter(m => {
        const query = (searchQuery || "").toLowerCase();
        return (m.customer?.name || "").toLowerCase().includes(query) ||
            (m.customer?.phone || "").includes(searchQuery || "") ||
            (m.customer?.address || "").toLowerCase().includes(query);
    });

    return (
        <Box sx={{ width: '100%' }}>
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
                    placeholder="گاہک کے نام یا فون سے تلاش کریں..."
                    variant="outlined"
                    size="small"
                    dir="rtl"
                    sx={{ width: 450, bgcolor: 'white' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                        style: { textAlign: 'right' }
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
                    className="font-urdu"
                >
                    نئی پیمائش درج کریں
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
                            <TableCell sx={{ fontWeight: 600 }} align="right" className="font-urdu">ایکشن</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right" className="font-urdu">واسکٹ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right" className="font-urdu">شلوار قمیض</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right" className="font-urdu">تاریخ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right" className="font-urdu">گاہک</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMeasurements.length > 0 ? (
                            filteredMeasurements.map((m) => (
                                <TableRow
                                    key={m.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
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
                                    <TableCell align="right">
                                        {m.wskot_lambai ? (
                                            <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 500 }} className="font-urdu">
                                                ریکارڈڈ
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary" className="font-urdu">نہیں ہے</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {m.qameez_lambai ? (
                                            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }} className="font-urdu">
                                                ریکارڈڈ
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary" className="font-urdu">نہیں ہے</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                            <Typography variant="body2">
                                                {new Date(m.takenAt).toLocaleDateString()}
                                            </Typography>
                                            <Calendar size={14} className="text-zinc-400" />
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                            <Box sx={{
                                                p: 1,
                                                bgcolor: '#f5f3ff',
                                                borderRadius: 2,
                                                color: '#8b5cf6'
                                            }}>
                                                <User size={20} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                                                    {m.customer?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right' }}>
                                                    {m.customer?.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary" className="font-urdu">کوئی پیمائش نہیں ملی</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Form Card Overlay */}
            {open && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    minHeight: '100%',
                    bgcolor: '#f9fafb',
                    zIndex: 10,
                    p: 0
                }}>
                    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }} className="font-urdu">
                                {editMode ? "پیمائش تبدیل کریں" : "نئی پیمائش شامل کریں"}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save size={18} />}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none' }}
                                    className="font-urdu"
                                >
                                    {loading ? <CircularProgress size={20} color="inherit" /> : (editMode ? "اپ ڈیٹ کریں" : "محفوظ کریں")}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<X size={18} />}
                                    onClick={handleClose}
                                    sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none' }}
                                    className="font-urdu"
                                >
                                    منسوخ
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                            <Grid container spacing={3} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">
                                            {t('selectCustomer')}
                                        </Typography>
                                    </Box>
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        sx={{ minWidth: 400 }}
                                        options={customers}
                                        getOptionLabel={(option) => `${option.name || ""} ${option.phone ? `(${option.phone})` : ""}`}
                                        value={customers.find(c => c.id === formData.customerId) || null}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                customerId: newValue ? newValue.id : ""
                                            }));
                                        }}
                                        disabled={editMode}
                                        filterOptions={(options, { inputValue }) => {
                                            const query = (inputValue || "").toLowerCase();
                                            return options.filter(option => {
                                                const nameMatch = (option.name || "").toLowerCase().includes(query);
                                                const phoneMatch = (option.phone || "").includes(query);
                                                const addressMatch = (option.address || "").toLowerCase().includes(query);
                                                return nameMatch || phoneMatch || addressMatch;
                                            });
                                        }}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} sx={{ borderBottom: '1px solid #f3f4f6', py: 1.5 }}>
                                                <Grid container alignItems="center" sx={{ flexDirection: 'row-reverse' }}>
                                                    <Grid item sx={{ display: 'flex', width: 44, ml: 2 }}>
                                                        <Box sx={{ p: 1, bgcolor: '#f5f3ff', borderRadius: 2, color: '#8b5cf6' }}>
                                                            <User size={18} />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs sx={{ wordWrap: 'break-word', textAlign: 'right' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                                            {option.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, justifyContent: 'flex-end' }}>
                                                            {option.address && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {option.address}
                                                                    </Typography>
                                                                    <MapPin size={12} className="text-zinc-400" />
                                                                </Box>
                                                            )}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {option.phone}
                                                                </Typography>
                                                                <Phone size={12} className="text-zinc-400" />
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                required
                                                placeholder="..."
                                                variant="outlined"
                                                dir="rtl"
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
                                {formData.customerId && (
                                    <Grid item xs={12} md={3}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">
                                                {t('unit')}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            select
                                            required
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
                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                },
                                                '& .MuiOutlinedInput-input': { textAlign: 'right' }
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
                                    <Typography color="textSecondary" variant="h6" className="font-urdu">
                                        {t('pleaseSelectCustomer')}
                                    </Typography>
                                    <Typography color="textSecondary" variant="body2" className="font-urdu">
                                        {t('measurementFieldsAppear')}
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                        <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} aria-label="measurement tabs" sx={{ '& .MuiTab-root': { flexDirection: 'row-reverse', gap: 1 } }}>
                                            <Tab icon={<Shirt size={18} />} iconPosition="start" label={t('shalwarQameez')} className="font-urdu" sx={{ fontWeight: 700 }} />
                                            <Tab icon={<Square size={18} />} iconPosition="start" label={t('waistcoat')} className="font-urdu" sx={{ fontWeight: 700 }} />
                                        </Tabs>
                                    </Box>

                                    {modalTab === 0 && (
                                        <Box sx={{ p: 1 }}>
                                            {/* Qameez Section */}
                                            <Box sx={{ borderBottom: '1px solid #f3f4f6', pb: 1, mb: 2, mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b5cf6' }} className="font-urdu">
                                                    {t('qameez')}
                                                </Typography>
                                            </Box>
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
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#4b5563' }} className="font-urdu">
                                                                {t(field.label)}
                                                            </Typography>
                                                        </Box>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            required
                                                            name={field.name}
                                                            value={formData[field.name]}
                                                            onChange={handleInputChange}
                                                            variant="outlined"
                                                            dir="rtl"
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: 'white',
                                                                    borderRadius: '8px',
                                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                                },
                                                                '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                                            }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>

                                            {/* Shalwar Section */}
                                            <Box sx={{ borderBottom: '1px solid #f3f4f6', pb: 1, mb: 2, mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b5cf6' }} className="font-urdu">
                                                    {t('shalwar')}
                                                </Typography>
                                            </Box>
                                            <Grid container spacing={2}>
                                                {[
                                                    { name: 'shalwar_lambai', label: 'shalwar_lambai' },
                                                    { name: 'puhncha', label: 'puhncha' },
                                                    { name: 'shalwar_gheera', label: 'shalwar_gheera' },
                                                ].map((field) => (
                                                    <Grid item xs={6} sm={4} md={3} key={field.name}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#4b5563' }} className="font-urdu">
                                                                {t(field.label)}
                                                            </Typography>
                                                        </Box>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            required
                                                            name={field.name}
                                                            value={formData[field.name]}
                                                            onChange={handleInputChange}
                                                            variant="outlined"
                                                            dir="rtl"
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: 'white',
                                                                    borderRadius: '8px',
                                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                                },
                                                                '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                                            }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    {modalTab === 1 && (
                                        <Box sx={{ p: 1 }}>
                                            <Box sx={{ borderBottom: '1px solid #f3f4f6', pb: 1, mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} className="font-urdu">
                                                    {t('waistcoat')}
                                                </Typography>
                                                <Ruler size={18} />
                                            </Box>
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
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#4b5563' }} className="font-urdu">
                                                                {t(field.label)}
                                                            </Typography>
                                                        </Box>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            required
                                                            name={field.name}
                                                            value={formData[field.name]}
                                                            onChange={handleInputChange}
                                                            variant="outlined"
                                                            dir="rtl"
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{formData.unit}</Typography></InputAdornment>,
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: 'white',
                                                                    borderRadius: '8px',
                                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                                },
                                                                '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                                            }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    <Box sx={{ mt: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937' }} className="font-urdu">
                                                {t('additionalNotes')}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            name="notes"
                                            required
                                            placeholder="..."
                                            multiline
                                            rows={3}
                                            dir="rtl"
                                            value={formData.notes}
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
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Card>
                </Box>
            )}

            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
            >
                <Alert severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
            </Snackbar>
        </Box >
    );
}
