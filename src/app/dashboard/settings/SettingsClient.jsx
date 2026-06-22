"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Checkbox,
    FormGroup,
    Grid,
    Divider,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { 
    AlertTriangle, 
    RotateCcw, 
    ShieldAlert, 
    UploadCloud, 
    Download, 
    FileSpreadsheet, 
    CheckCircle,
    Trash2
} from "lucide-react";

const DB_TABLE_GROUPS = [
    {
        title: "Transactional & Financial Data",
        description: "Business activity, sales, ledger entries, and stitching process details.",
        tables: [
            { id: "booking", label: "Bookings", description: "All bookings, item details, tailor/cutter assignments", tables: ["booking", "booking_item", "booking_staff", "booking_item_stitching_option"] },
            { id: "order", label: "Stitching Orders", description: "Orders assigned to stitching employees", tables: ["order"] },
            { id: "ledgerentry", label: "Ledger Entries", description: "Financial ledger entries for customer accounts", tables: ["ledgerentry"] },
            { id: "bill", label: "Bills & Invoices", description: "Invoiced billing details for customers", tables: ["bill", "bill_item"] },
            { id: "purchase", label: "Purchases & Payments", description: "Supplier purchases, items, and bank payment history", tables: ["purchase", "purchase_item", "purchase_payment"] },
            { id: "expense", label: "Expenses", description: "General office and business expense records", tables: ["expense"] },
            { id: "stockmovement", label: "Stock Movements", description: "Historical log of product inventory changes", tables: ["stockmovement"] },
            { id: "materialmovement", label: "Material Movements", description: "Historical log of fabric/material usage", tables: ["materialmovement"] },
        ]
    },
    {
        title: "Master Data & Setup",
        description: "Customers, product catalog, materials, and system configuration.",
        tables: [
            { id: "customer", label: "Customers", description: "Client profiles and contact directory", tables: ["customer"] },
            { id: "measurement", label: "Measurements", description: "Customer body sizing records and notes", tables: ["measurement"] },
            { id: "product", label: "Products", description: "Stitched garments, fabrics, and pricing records", tables: ["product"] },
            { id: "category", label: "Product Categories", description: "Garment categories (e.g. Suit, Waistcoat)", tables: ["category"] },
            { id: "material", label: "Materials", description: "Stock inventory of fabric and stitching materials", tables: ["material"] },
            { id: "bank", label: "Banks", description: "Bank accounts and payment methods setup", tables: ["bank"] },
            { id: "employee", label: "Employees", description: "Staff profiles, tailors, cutters, and salaries", tables: ["employee"] },
            { id: "accountcategory", label: "Account Categories", description: "Customer ledger category types", tables: ["accountcategory"] },
            { id: "stitching_option", label: "Stitching Options", description: "Custom stitching add-ons and costs setup", tables: ["stitching_option"] },
        ]
    }
];

const DB_COLUMNS = [
    { key: "name", label: "Name", required: true, possibleHeaders: ["name", "customername", "fullname"] },
    { key: "code", label: "Code", required: false, possibleHeaders: ["code", "customercode", "id", "customerid"] },
    { key: "phone", label: "Phone", required: false, possibleHeaders: ["phone", "phonenumber", "cell", "mobile"] },
    { key: "email", label: "Email", required: false, possibleHeaders: ["email", "emailaddress"] },
    { key: "address", label: "Address", required: false, possibleHeaders: ["address", "homeaddress", "location"] },
    { key: "fatherName", label: "Father Name", required: false, possibleHeaders: ["fathername", "father"] },
    { key: "measurementNo", label: "Measurement No", required: false, possibleHeaders: ["measurementno", "measurementnumber", "measurement", "measno"] },
    { key: "category", label: "Category", required: false, possibleHeaders: ["category", "customercategory", "accountcategory", "group"] },
    { key: "balance", label: "Balance", required: false, possibleHeaders: ["balance", "openingbalance", "amount", "outstanding"] },
    { key: "notes", label: "Notes", required: false, possibleHeaders: ["notes", "note", "remarks", "description"] },
];

export default function SettingsClient() {
    const [tabIndex, setTabIndex] = useState(0);

    // ── Tab 0: Selective database reset state ──────────────────────────
    const [resetOpen, setResetOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedEntities, setSelectedEntities] = useState({});

    // ── Tab 1: Excel Import state ──────────────────────────────────────
    const [importFile, setImportFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [rawRows, setRawRows] = useState([]);
    const [excelHeaders, setExcelHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [isDragOver, setIsDragOver] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState("");
    const [importResult, setImportResult] = useState(null);

    // ── Tab 0 Handlers ────────────────────────────────────────────────
    const handleToggleEntity = (id) => {
        setSelectedEntities(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSelectAll = () => {
        const next = {};
        DB_TABLE_GROUPS.forEach(group => {
            group.tables.forEach(t => {
                next[t.id] = true;
            });
        });
        setSelectedEntities(next);
    };

    const handleClearAll = () => {
        setSelectedEntities({});
    };

    const handleSelectTransactions = () => {
        const next = {};
        DB_TABLE_GROUPS[0].tables.forEach(t => {
            next[t.id] = true;
        });
        DB_TABLE_GROUPS[1].tables.forEach(t => {
            next[t.id] = false;
        });
        setSelectedEntities(next);
    };

    const handleSelectMasterData = () => {
        const next = {};
        DB_TABLE_GROUPS[0].tables.forEach(t => {
            next[t.id] = false;
        });
        DB_TABLE_GROUPS[1].tables.forEach(t => {
            next[t.id] = true;
        });
        setSelectedEntities(next);
    };

    const getTablesToReset = () => {
        const tables = [];
        DB_TABLE_GROUPS.forEach(group => {
            group.tables.forEach(entity => {
                if (selectedEntities[entity.id]) {
                    tables.push(...entity.tables);
                }
            });
        });
        return tables;
    };

    const handleReset = async () => {
        setLoading(true);
        setError("");
        try {
            const tables = getTablesToReset();
            const res = await fetch("/api/reset-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, tables }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed.");

            const selectedCount = Object.values(selectedEntities).filter(Boolean).length;
            const totalCount = DB_TABLE_GROUPS.flatMap(g => g.tables).length;
            if (selectedCount === totalCount) {
                setSuccess("All data has been reset successfully. User accounts have been preserved.");
            } else {
                setSuccess("Selected data has been reset successfully.");
            }

            setResetOpen(false);
            setPassword("");
            setSelectedEntities({});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setResetOpen(false);
        setPassword("");
        setError("");
    };

    const selectedLabels = DB_TABLE_GROUPS.flatMap(g => g.tables)
        .filter(t => selectedEntities[t.id])
        .map(t => t.label);

    // ── Tab 1 Handlers ────────────────────────────────────────────────

    const handleDownloadTemplate = async () => {
        const XLSX = await import("xlsx");
        // Create headers array
        const headers = [
            [
                "Name",
                "Code",
                "Phone",
                "Email",
                "Address",
                "Father Name",
                "Measurement No",
                "Category",
                "Balance",
                "Notes"
            ]
        ];
        
        // Add sample row
        const sampleRow = [
            "Bilal Taylor",
            "CUST-206",
            "03001234567",
            "bilal@taylor.com",
            " faazal plaza dinga",
            "Muhammad Taylor",
            "M-104",
            "Regular",
            "1500.00",
            "A regular stitching client"
        ];
        headers.push(sampleRow);

        const ws = XLSX.utils.aoa_to_sheet(headers);
        
        // Adjust column widths
        ws["!cols"] = [
            { wch: 18 }, // Name
            { wch: 12 }, // Code
            { wch: 15 }, // Phone
            { wch: 22 }, // Email
            { wch: 25 }, // Address
            { wch: 18 }, // Father Name
            { wch: 16 }, // Measurement No
            { wch: 12 }, // Category
            { wch: 10 }, // Balance
            { wch: 25 }  // Notes
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customers Template");
        XLSX.writeFile(wb, "customers_import_template.xlsx");
    };

    const applyMapping = (rows, mapping) => {
        return rows.map(row => {
            const getVal = (dbKey) => {
                const excelHeader = mapping[dbKey];
                return excelHeader ? row[excelHeader] : undefined;
            };

            return {
                name: getVal("name"),
                code: getVal("code"),
                phone: getVal("phone"),
                email: getVal("email"),
                address: getVal("address"),
                fatherName: getVal("fatherName"),
                measurementNo: getVal("measurementNo"),
                category: getVal("category"),
                balance: getVal("balance"),
                notes: getVal("notes")
            };
        });
    };

    const handleMappingChange = (dbKey, excelHeader) => {
        const updatedMapping = { ...columnMapping, [dbKey]: excelHeader };
        setColumnMapping(updatedMapping);
        const updatedParsedData = applyMapping(rawRows, updatedMapping);
        setParsedData(updatedParsedData);
    };

    const processExcelFile = (file) => {
        if (!file) return;
        setImportError("");
        setImportResult(null);
        setImportFile(file);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const XLSX = await import("xlsx");
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse rows into JSON format
                const rawRowsData = XLSX.utils.sheet_to_json(worksheet);
                if (rawRowsData.length === 0) {
                    throw new Error("The uploaded Excel sheet contains no data.");
                }

                // Detect headers from raw rows
                const headers = [];
                rawRowsData.forEach(row => {
                    Object.keys(row).forEach(k => {
                        if (!headers.includes(k)) {
                            headers.push(k);
                        }
                    });
                });

                // Initialize mapping with smart guessing
                const initialMapping = {};
                DB_COLUMNS.forEach(col => {
                    const matchedHeader = headers.find(h => 
                        col.possibleHeaders.includes(h.toLowerCase().trim().replace(/[\s_]+/g, ""))
                    );
                    initialMapping[col.key] = matchedHeader || "";
                });

                const formattedRows = applyMapping(rawRowsData, initialMapping);

                setRawRows(rawRowsData);
                setExcelHeaders(headers);
                setColumnMapping(initialMapping);
                setParsedData(formattedRows);
            } catch (err) {
                setImportError(err.message || "Failed to parse the Excel file.");
                setImportFile(null);
                setParsedData([]);
                setRawRows([]);
                setExcelHeaders([]);
                setColumnMapping({});
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processExcelFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
            processExcelFile(file);
        } else {
            setImportError("Please upload a valid Excel spreadsheet file (.xlsx, .xls, or .csv).");
        }
    };

    const handleClearImport = () => {
        setImportFile(null);
        setParsedData([]);
        setRawRows([]);
        setExcelHeaders([]);
        setColumnMapping({});
        setImportError("");
        setImportResult(null);
    };

    const handleConfirmImport = async () => {
        if (parsedData.length === 0) return;
        setImportLoading(true);
        setImportError("");
        setImportResult(null);

        try {
            const res = await fetch("/api/customers/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customers: parsedData })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import customers.");

            setImportResult(data);
            setSuccess(`Successfully imported ${data.imported} customer(s).`);
            setParsedData([]);
            setRawRows([]);
            setExcelHeaders([]);
            setColumnMapping({});
            setImportFile(null);
        } catch (err) {
            setImportError(err.message);
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* Page header */}
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage system configuration, data backup, and file imports.
            </Typography>

            {success && (
                <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3, borderRadius: 2, maxWidth: 900 }}>
                    {success}
                </Alert>
            )}

            {/* Tabs navigation */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, maxWidth: 900 }}>
                <Tabs 
                    value={tabIndex} 
                    onChange={(_, val) => setTabIndex(val)} 
                    textColor="primary" 
                    indicatorColor="primary"
                >
                    <Tab label="Database Reset" sx={{ textTransform: "none", fontWeight: 600 }} />
                    <Tab label="Import Customers from Excel" sx={{ textTransform: "none", fontWeight: 600 }} />
                </Tabs>
            </Box>

            {/* Tab 0: Selective Database Reset */}
            {tabIndex === 0 && (
                <Card
                    elevation={0}
                    sx={{
                        border: "1px solid",
                        borderColor: "error.light",
                        borderRadius: 3,
                        maxWidth: 900,
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                            <AlertTriangle size={20} color="#ef4444" />
                            <Typography variant="subtitle1" fontWeight={700} color="error.main">
                                Danger Zone: Selective Database Reset
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Select the specific tables/data groups you want to delete. Bypassing foreign key constraints is handled automatically, but deleting master data (like customers or products) while keeping transaction history (like bookings or bills) may result in orphaned records.
                        </Typography>

                        {/* Helper buttons */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3.5 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleSelectAll}
                                sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleSelectTransactions}
                                sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                            >
                                Select Transactions Only
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleSelectMasterData}
                                sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                            >
                                Select Master Data Only
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleClearAll}
                                sx={{ borderRadius: 2, textTransform: "none", borderColor: "divider", color: "text.primary" }}
                            >
                                Clear Selection
                            </Button>
                        </Box>

                        <Grid container spacing={4}>
                            {DB_TABLE_GROUPS.map((group, groupIdx) => (
                                <Grid item xs={12} md={6} key={groupIdx}>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                                        {group.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                        {group.description}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <FormGroup>
                                        {group.tables.map((table) => {
                                            const isChecked = !!selectedEntities[table.id];
                                            return (
                                                <Box
                                                    key={table.id}
                                                    onClick={() => handleToggleEntity(table.id)}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        p: 1.5,
                                                        mb: 1,
                                                        borderRadius: 2,
                                                        border: "1px solid",
                                                        borderColor: isChecked ? "error.light" : "transparent",
                                                        bgcolor: isChecked ? "rgba(239, 68, 68, 0.03)" : "transparent",
                                                        transition: "all 0.2s",
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            bgcolor: isChecked ? "rgba(239, 68, 68, 0.05)" : "action.hover",
                                                            borderColor: isChecked ? "error.main" : "divider"
                                                        }
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleEntity(table.id);
                                                        }}
                                                        color="error"
                                                        size="small"
                                                        sx={{ p: 0.5, mt: -0.2 }}
                                                    />
                                                    <Box sx={{ ml: 1 }}>
                                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                                            {table.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.2 }}>
                                                            {table.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </FormGroup>
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={!Object.values(selectedEntities).some(Boolean)}
                                startIcon={<RotateCcw size={16} />}
                                onClick={() => setResetOpen(true)}
                                sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                            >
                                Reset Selected Data
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Tab 1: Excel Customer Import */}
            {tabIndex === 1 && (
                <Box sx={{ maxWidth: 900 }}>
                    <Grid container spacing={3}>
                        
                        {/* Left Side: Setup Guidelines */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                        <FileSpreadsheet size={18} color="#059669" />
                                        Spreadsheet Setup
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                        To import correctly, the spreadsheet headers must match these names (spaces or capitalizations are automatically handled):
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                                        {[
                                            { name: "Name", req: true, desc: "Customer full name" },
                                            { name: "Code", req: false, desc: "Unique code/ID (e.g. C-101)" },
                                            { name: "Phone", req: false, desc: "Mobile/telephone number" },
                                            { name: "Email", req: false, desc: "Email address" },
                                            { name: "Address", req: false, desc: "Living/billing address" },
                                            { name: "Father Name", req: false, desc: "Customer father name" },
                                            { name: "Measurement No", req: false, desc: "Measurements ID reference" },
                                            { name: "Category", req: false, desc: "Category (Regular, VIP, Wholesale)" },
                                            { name: "Balance", req: false, desc: "Opening balance (Rs. defaults to 0)" },
                                            { name: "Notes", req: false, desc: "Additional remarks" },
                                        ].map((col) => (
                                            <Box key={col.name} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 0.8, borderBottom: "1px dashed", borderColor: "action.hover" }}>
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} display="block">
                                                        {col.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {col.desc}
                                                    </Typography>
                                                </Box>
                                                {col.req ? (
                                                    <Typography variant="caption" color="error.main" fontWeight={700} sx={{ fontSize: "0.65rem", textTransform: "uppercase" }}>Required</Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", textTransform: "uppercase" }}>Optional</Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="success"
                                        startIcon={<Download size={15} />}
                                        onClick={handleDownloadTemplate}
                                        sx={{ mt: 3, borderRadius: 2, textTransform: "none", fontSize: "0.8rem", py: 1 }}
                                    >
                                        Download Excel Template
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right Side: Uploader & Preview */}
                        <Grid item xs={12} md={8}>
                            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                        Upload Customer Data Spreadsheet
                                    </Typography>

                                    {importError && (
                                        <Alert severity="error" onClose={() => setImportError("")} sx={{ mb: 3, borderRadius: 2 }}>
                                            {importError}
                                        </Alert>
                                    )}

                                    {importResult && (
                                        <Alert severity="success" icon={<CheckCircle size={20} />} sx={{ mb: 3, borderRadius: 2 }}>
                                            <strong>Import Finished!</strong>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                • Imported: {importResult.imported} customers<br />
                                                • Skipped/Duplicates: {importResult.skipped} records
                                            </Typography>
                                            {importResult.skippedDetails?.length > 0 && (
                                                <Box sx={{ mt: 1.5, maxHeight: 100, overflowY: "auto", bgcolor: "rgba(0,0,0,0.02)", p: 1, borderRadius: 1.5 }}>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">Skipped Details:</Typography>
                                                    {importResult.skippedDetails.map((s, idx) => (
                                                        <Typography key={idx} variant="caption" display="block" color="text.secondary">
                                                            - {s.name || "Row"}: {s.reason}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Alert>
                                    )}

                                    {/* Drag & Drop Zone */}
                                    {!importFile ? (
                                        <Box
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            sx={{
                                                border: "2px dashed",
                                                borderColor: isDragOver ? "primary.main" : "divider",
                                                borderRadius: 3,
                                                bgcolor: isDragOver ? "rgba(59, 130, 246, 0.04)" : "action.hover",
                                                p: 4,
                                                textAlign: "center",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    borderColor: "primary.main",
                                                    bgcolor: "rgba(59, 130, 246, 0.02)"
                                                }
                                            }}
                                            component="label"
                                        >
                                            <input 
                                                type="file" 
                                                hidden 
                                                accept=".xlsx,.xls,.csv" 
                                                onChange={handleFileChange} 
                                            />
                                            <UploadCloud size={36} color="#6b7280" style={{ marginBottom: 12 }} />
                                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                                Drag and drop your Excel file here
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Supports .xlsx, .xls, and .csv files
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                component="span"
                                                sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
                                            >
                                                Select File
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "action.hover" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar sx={{ bgcolor: "success.light", color: "success.main" }}>
                                                    <FileSpreadsheet size={20} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{importFile.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {(importFile.size / 1024).toFixed(1)} KB · {parsedData.length} records parsed
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <IconButton color="error" onClick={handleClearImport} disabled={importLoading}>
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Column Mapping Section */}
                            {importFile && excelHeaders.length > 0 && (
                                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                            Column Mapping
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                                            Map Excel columns to Database customer columns. Ensure the required <strong>Name</strong> column is mapped correctly.
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {DB_COLUMNS.map((col) => {
                                                const currentMapping = columnMapping[col.key] || "";
                                                return (
                                                    <Grid item xs={12} sm={6} key={col.key}>
                                                        <FormControl fullWidth size="small" required={col.required}>
                                                            <InputLabel id={`mapping-select-label-${col.key}`}>
                                                                {col.label} {col.required && "*"}
                                                            </InputLabel>
                                                            <Select
                                                                labelId={`mapping-select-label-${col.key}`}
                                                                id={`mapping-select-${col.key}`}
                                                                value={currentMapping}
                                                                label={`${col.label} ${col.required ? "*" : ""}`}
                                                                onChange={(e) => handleMappingChange(col.key, e.target.value)}
                                                                sx={{ borderRadius: 2 }}
                                                            >
                                                                {!col.required && (
                                                                    <MenuItem value="">
                                                                        <em>Skip (Do not import)</em>
                                                                    </MenuItem>
                                                                )}
                                                                {excelHeaders.map((header) => (
                                                                    <MenuItem key={header} value={header}>
                                                                        {header}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Excel Data Preview Table */}
                            {parsedData.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, px: 0.5 }}>
                                        Previewing Data ({parsedData.length} rows)
                                    </Typography>
                                    {!columnMapping.name && (
                                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                            Please map the <strong>Name</strong> field to enable importing.
                                        </Alert>
                                    )}
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 300, mb: 3 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f8fafc" }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f8fafc" }}>Code</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f8fafc" }}>Phone</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f8fafc" }}>Category</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f8fafc" }}>Balance</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {parsedData.slice(0, 50).map((row, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: row.name ? 500 : 400, color: row.name ? "text.primary" : "error.main" }}>
                                                            {row.name || "Missing Name"}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                                                            {row.code || "—"}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: "0.75rem" }}>
                                                            {row.phone || "—"}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: "0.75rem" }}>
                                                            {row.category || "—"}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                                            Rs. {parseFloat(row.balance || 0).toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {parsedData.length > 50 && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, px: 0.5, fontStyle: "italic" }}>
                                            Showing first 50 rows of {parsedData.length} records.
                                        </Typography>
                                    )}

                                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            onClick={handleClearImport}
                                            disabled={importLoading}
                                            sx={{ borderRadius: 2, textTransform: "none" }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={importLoading ? null : <CheckCircle size={16} />}
                                            onClick={handleConfirmImport}
                                            disabled={importLoading || !columnMapping.name}
                                            sx={{ borderRadius: 2, textTransform: "none", px: 4 }}
                                        >
                                            {importLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm & Import to Database"}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Confirm Dialog (Selective reset) */}
            <Dialog
                open={resetOpen}
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        pb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <ShieldAlert size={20} color="#ef4444" />
                    Confirm Data Reset
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: "0.82rem" }}>
                        This will <strong>permanently delete</strong> the following selected business data. This action cannot be undone.
                    </Alert>

                    <Box sx={{ mb: 2.5, p: 2, bgcolor: "action.hover", borderRadius: 2, maxHeight: 150, overflowY: "auto", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1, textTransform: "uppercase" }}>
                            Selected for Deletion:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {selectedLabels.map(label => (
                                <Box
                                    key={label}
                                    sx={{
                                        px: 1.5,
                                        py: 0.5,
                                        bgcolor: "error.light",
                                        color: "error.contrastText",
                                        borderRadius: 1.5,
                                        fontSize: "0.75rem",
                                        fontWeight: 600
                                    }}
                                >
                                    {label}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        label="Enter password to confirm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter" && password && !loading) handleReset(); }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
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
                        color="error"
                        onClick={handleReset}
                        disabled={loading || !password.trim()}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : `Reset (${selectedLabels.length}) Items`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
