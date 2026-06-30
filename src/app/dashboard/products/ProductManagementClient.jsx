"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Box,
    Button,
    IconButton,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Grid,
    Divider,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X as XIcon,
    Package,
    Save,
    Printer,
    Tag,
    RefreshCw,
} from "lucide-react";
import JsBarcode from "jsbarcode";

// Generate barcode SVG string using an offscreen element (no DOM ref needed)
function makeBarcodesvg(value) {
    try {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        JsBarcode(svg, value, {
            format: "CODE128",
            width: 2,
            height: 55,
            displayValue: true,
            fontSize: 11,
            margin: 5,
            background: "#ffffff",
            lineColor: "#000000",
        });
        return new XMLSerializer().serializeToString(svg);
    } catch {
        return "";
    }
}

export default function ProductManagementClient({ initialProducts }) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");

    // Calculate total stock cost price and retail sale price
    const totalStockCost = (products || []).reduce((sum, p) => sum + (parseFloat(p.costPrice || 0) * parseFloat(p.quantity || 0)), 0);
    const totalStockSale = (products || []).reduce((sum, p) => sum + (parseFloat(p.unitPrice || 0) * parseFloat(p.quantity || 0)), 0);
    const totalStockQty = (products || []).reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0);

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProdId, setSelectedProdId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        quantity: 0,
        costPrice: "",
        unitPrice: "",
        barcode: "",
    });

    const generateBarcode = () => {
        const ts = Date.now().toString().slice(-8);
        const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
        return ts + rand;
    };

    // ── Barcode print state ──────────────────────────────
    const [printProduct, setPrintProduct] = useState(null);
    const [printQty, setPrintQty] = useState(1);
    const [barcodeSvg, setBarcodeSvg] = useState("");   // serialized SVG string

    // Regenerate barcode SVG whenever the selected product changes
    useEffect(() => {
        if (!printProduct) { setBarcodeSvg(""); return; }
        const value = printProduct.barcode || printProduct.sku || "NOSKU";
        setBarcodeSvg(makeBarcodesvg(value));
    }, [printProduct]);

    const handlePrintLabel = (prod) => {
        setPrintProduct(prod);
        setPrintQty(1);
    };

    const closePrintDialog = () => {
        setPrintProduct(null);
        setBarcodeSvg("");
    };

    const handlePrint = () => {
        if (!barcodeSvg) {
            alert("Barcode not ready. Please wait a moment and try again.");
            return;
        }

        const safeName = (printProduct.name || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const price = `Rs. ${parseFloat(printProduct.unitPrice || 0).toLocaleString()}`;

        const sticker = `
<div class="sticker">
  <div class="brand">Grace Cloth &amp; Tailors</div>
  <div class="pname">${safeName}</div>
  <div class="barcode-wrap">${barcodeSvg}</div>
  <div class="price">${price}</div>
</div>`;

        const win = window.open("", "_blank", "width=500,height=350");
        if (!win) {
            alert("Popup blocked — please allow popups for this site.");
            return;
        }

        win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Label</title>
<style>
  @page { margin: 0; size: 2in 1in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 2in; font-family: Arial, Helvetica, sans-serif; background: #fff; }
  .sticker {
    width: 2in;
    height: 1in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px 3px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .sticker:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }
  .brand {
    font-size: 6.5pt;
    font-weight: bold;
    text-align: center;
    letter-spacing: 0.3px;
    line-height: 1.2;
  }
  .pname {
    font-size: 7pt;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
    margin-top: 1pt;
  }
  .barcode-wrap {
    width: 1.88in;
    margin: 1pt 0;
    display: block;
    text-align: center;
  }
  .barcode-wrap svg {
    width: 1.88in !important;
    height: 0.44in !important;
    display: block;
  }
  .price {
    font-size: 8.5pt;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    margin-top: 1pt;
  }
</style>
</head>
<body>
${Array(Math.max(1, printQty)).fill(sticker).join("\n")}
<script>
  window.onload = function () {
    setTimeout(function () { window.print(); }, 300);
  };
<\/script>
</body>
</html>`);
        win.document.close();
    };

    // ── Product CRUD handlers ────────────────────────────
    const resetForm = () => {
        setFormData({ sku: "", name: "", description: "", quantity: 0, costPrice: "", unitPrice: "", barcode: "" });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
    };

    const handleOpen = () => { resetForm(); setOpen(true); };

    const handleClose = () => {
        if (!loading) { setOpen(false); resetForm(); }
    };

    const handleEdit = (prod) => {
        setEditMode(true);
        setSelectedProdId(prod.id);
        setFormData({
            sku: prod.sku || "",
            name: prod.name || "",
            description: prod.description || "",
            quantity: prod.quantity || 0,
            costPrice: prod.costPrice || "",
            unitPrice: prod.unitPrice || "",
            barcode: prod.barcode || "",
        });
        setOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedProdId } : formData;

            const response = await fetch("/api/products", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? "update" : "create"} product`);
            }

            const refreshRes = await fetch("/api/products");
            const refreshedProds = await refreshRes.json();
            setProducts(refreshedProds);
            setSuccessMessage(`Product ${editMode ? "updated" : "added"} successfully!`);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const response = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete product");
            }
            setProducts(prev => prev.filter(p => p.id !== id));
            setSuccessMessage("Product deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredProducts = (products || []).filter(prod =>
        (prod.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }}>
                    <Card sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        color: "white",
                        borderRadius: 3,
                        boxShadow: "0 10px 40px rgba(59, 130, 246, 0.15)",
                    }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                    Total Stock Quantity
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                    {totalStockQty.toLocaleString()}
                                </Typography>
                            </Box>
                            <Package size={36} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
                {isAdmin && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{
                            p: 3,
                            background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                            color: "white",
                            borderRadius: 3,
                            boxShadow: "0 10px 40px rgba(139, 92, 246, 0.15)",
                        }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        Total Stock Price (Cost Value)
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        Rs. {totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                                <RefreshCw size={36} style={{ opacity: 0.8 }} />
                            </Box>
                        </Card>
                    </Grid>
                )}
                <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }}>
                    <Card sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                        color: "white",
                        borderRadius: 3,
                        boxShadow: "0 10px 40px rgba(5, 150, 105, 0.15)",
                    }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                    Total Stock Sale Price (Retail Value)
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                    Rs. {totalStockSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Tag size={36} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Action bar ─────────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search by name or product code…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 360 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                >
                    Add Product
                </Button>
            </Box>

            {/* ── Products table ──────────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Code / Barcode</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                                {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Cost Price</TableCell>}
                                <TableCell sx={{ fontWeight: 700 }}>Sale Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((prod) => (
                                    <TableRow key={prod.id} sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={(t) => ({
                                                        width: 36, height: 36,
                                                        bgcolor: t.palette.primary.light,
                                                        color: t.palette.primary.main,
                                                        borderRadius: 1.5,
                                                    })}
                                                >
                                                    <Package size={18} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{prod.name}</Typography>
                                                    {prod.description && (
                                                        <Typography variant="caption" color="text.secondary">{prod.description}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: "action.hover", px: 1, py: 0.3, borderRadius: 1, display: "inline-block" }}>
                                                {prod.sku}
                                            </Typography>
                                            {prod.barcode && (
                                                <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ display: "block", mt: 0.3 }}>
                                                    {prod.barcode}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                sx={{ color: prod.quantity <= 5 ? "error.main" : "success.main" }}
                                            >
                                                {prod.quantity} units
                                            </Typography>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    Rs. {parseFloat(prod.costPrice || 0).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} color="success.main">
                                                Rs. {parseFloat(prod.unitPrice || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                                <Tooltip title="Print Label">
                                                    <IconButton size="small" sx={{ color: "secondary.main" }} onClick={() => handlePrintLabel(prod)}>
                                                        <Printer size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Product">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(prod)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Product">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(prod.id)}>
                                                        <Trash2 size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 8 }}>
                                        <Package size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>No products found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Print Label Dialog ──────────────────────────── */}
            <Dialog
                open={!!printProduct}
                onClose={closePrintDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Tag size={20} />
                    Print Barcode Label
                </DialogTitle>

                <DialogContent sx={{ pt: "20px !important", pb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Preview — 2&quot; × 1&quot; sticker
                    </Typography>

                    {/* Sticker preview — mirrors exact print layout */}
                    <Box sx={{
                        width: 360,
                        height: 180,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: "6px 10px",
                        mx: "auto",
                        my: 2,
                        bgcolor: "#fff",
                        gap: 0.3,
                        overflow: "hidden",
                    }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: "Arial, sans-serif", letterSpacing: 0.4, color: "#000" }}>
                            Grace Cloth &amp; Tailors
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "Arial, sans-serif", color: "#000" }}>
                            {printProduct?.name}
                        </Typography>

                        {/* Inline SVG barcode preview */}
                        {barcodeSvg ? (
                            <Box
                                sx={{ width: "100%", display: "flex", justifyContent: "center", "& svg": { width: "100% !important", height: "70px !important" } }}
                                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                            />
                        ) : (
                            <Box sx={{ height: 70, display: "flex", alignItems: "center" }}>
                                <Typography variant="caption" color="text.disabled">Generating barcode…</Typography>
                            </Box>
                        )}

                        <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "Arial, sans-serif", color: "#000" }}>
                            Rs. {parseFloat(printProduct?.unitPrice || 0).toLocaleString()}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <TextField
                        label="Number of copies"
                        type="number"
                        size="small"
                        value={printQty}
                        onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                        inputProps={{ min: 1, max: 200 }}
                        sx={{ width: 170 }}
                        variant="outlined"
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={closePrintDialog}
                        variant="outlined"
                        color="inherit"
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Printer size={17} />}
                        onClick={handlePrint}
                        disabled={!barcodeSvg}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        Print{printQty > 1 ? ` (${printQty} copies)` : ""}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Add / Edit Product Dialog ───────────────────── */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {editMode ? "Edit Product" : "Add New Product"}
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Product Code" name="sku" required
                                placeholder="e.g. PRD-001"
                                value={formData.sku}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Product Name" name="name" required
                                placeholder="e.g. Cotton Shirt"
                                value={formData.name}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth size="small" label="Barcode (Code 128)" name="barcode"
                                placeholder="Click ↻ to auto-generate, or type manually"
                                value={formData.barcode}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title="Auto-generate barcode">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setFormData(prev => ({ ...prev, barcode: generateBarcode() }))}
                                                >
                                                    <RefreshCw size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        {isAdmin && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth size="small" label="Cost Price" name="costPrice" type="number"
                                    placeholder="0.00"
                                    value={formData.costPrice}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                />
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: isAdmin ? 4 : 6 }}>
                            <TextField
                                fullWidth size="small" label="Sale Price" name="unitPrice" type="number" required
                                placeholder="0.00"
                                value={formData.unitPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: isAdmin ? 4 : 6 }}>
                            <TextField
                                fullWidth size="small" label="Stock Quantity" name="quantity" type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                inputProps={{ step: "any", min: 0 }}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth size="small" label="Description" name="description"
                                placeholder="Optional description…"
                                multiline rows={2}
                                value={formData.description}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading} startIcon={<XIcon size={17} />} sx={{ borderRadius: 2, textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained" onClick={handleSubmit}
                        disabled={loading || !formData.name?.trim() || !formData.sku?.trim()}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3, fontWeight: 600 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : editMode ? "Update Product" : "Save Product"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ────────────────────────────── */}
            <Snackbar
                open={!!successMessage} autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
