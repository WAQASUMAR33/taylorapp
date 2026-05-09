"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import JsBarcode from "jsbarcode";

export default function ProductManagementClient({ initialProducts }) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");

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
    });

    // ── Barcode print state ──────────────────────────────
    const [printProduct, setPrintProduct] = useState(null);
    const [printQty, setPrintQty] = useState(1);
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (!printProduct || !barcodeRef.current) return;
        try {
            JsBarcode(barcodeRef.current, printProduct.sku || "NOSKU", {
                format: "CODE128",
                width: 1.5,
                height: 38,
                displayValue: true,
                fontSize: 9,
                margin: 2,
                textMargin: 1,
                background: "#ffffff",
                lineColor: "#000000",
            });
        } catch (e) {
            console.error("Barcode generation failed:", e);
        }
    }, [printProduct]);

    const handlePrintLabel = (prod) => {
        setPrintProduct(prod);
        setPrintQty(1);
    };

    const closePrintDialog = () => setPrintProduct(null);

    const handlePrint = () => {
        const svgEl = barcodeRef.current;
        if (!svgEl) return;

        // Inline SVG is far more reliable in print popups than data: URLs
        const svgStr = new XMLSerializer().serializeToString(svgEl);

        const safeName = (printProduct.name || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const price = `Rs. ${parseFloat(printProduct.unitPrice || 0).toLocaleString()}`;

        const sticker = `
          <div class="sticker">
            <div class="brand">Grace Cloth &amp; Tailors</div>
            <div class="pname">${safeName}</div>
            <div class="barcode-wrap">${svgStr}</div>
            <div class="price">${price}</div>
          </div>`;

        const win = window.open("", "_blank", "width=400,height=300");
        if (!win) {
            alert("Popup blocked. Please allow popups for this site.");
            return;
        }

        win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Print Label</title>
<style>
  @page { margin: 0; size: 2in 1in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
  .page { display: flex; flex-wrap: wrap; }
  .sticker {
    width: 2in;
    height: 1in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px 4px 1px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .brand { font-size: 6.5pt; font-weight: bold; text-align: center; letter-spacing: 0.2px; line-height: 1.2; }
  .pname { font-size: 7pt; font-weight: 600; text-align: center; line-height: 1.2; margin-top: 1px; }
  .barcode-wrap { width: 1.9in; margin: 1px 0; display: flex; align-items: center; justify-content: center; }
  .barcode-wrap svg { width: 100% !important; height: auto !important; display: block; }
  .price { font-size: 8.5pt; font-weight: bold; text-align: center; line-height: 1; }
</style>
</head>
<body>
<div class="page">
${Array(Math.max(1, printQty)).fill(sticker).join("")}
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
        win.document.close();
    };

    // ── Product CRUD handlers ────────────────────────────
    const resetForm = () => {
        setFormData({ sku: "", name: "", description: "", quantity: 0, costPrice: "", unitPrice: "" });
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
                                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Cost Price</TableCell>
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
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                Rs. {parseFloat(prod.costPrice || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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

                    {/* Sticker preview */}
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
                        gap: 0.4,
                    }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: "Arial, sans-serif", letterSpacing: 0.4, color: "#000" }}>
                            Grace Cloth &amp; Tailors
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "Arial, sans-serif", color: "#000" }}>
                            {printProduct?.name}
                        </Typography>
                        <svg ref={barcodeRef} style={{ width: "100%", height: 68 }} />
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
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth size="small" label="Sale Price" name="unitPrice" type="number" required
                                placeholder="0.00"
                                value={formData.unitPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth size="small" label="Stock Quantity" name="quantity" type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={handleInputChange}
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
