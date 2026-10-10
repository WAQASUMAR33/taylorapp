"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";
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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Paper,
    Badge,
    TablePagination,
    Tabs,
    Tab,
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
    Store,
    Layers,
    ArrowRightLeft,
    ArrowRight,
    History,
    Check,
} from "lucide-react";
import JsBarcode from "jsbarcode";

// Generate barcode SVG string using an offscreen element
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

// Helper to calculate stock quantity for a product under a specific branch store
export function getProductBranchStock(prod, branchId) {
    if (!prod) return 0;
    if (!branchId || branchId === "ALL") {
        if (prod.branchStocks && prod.branchStocks.length > 0) {
            return prod.branchStocks.reduce((sum, bs) => sum + parseFloat(bs.quantity || 0), 0);
        }
        return parseFloat(prod.quantity || 0);
    }
    const bId = parseInt(branchId);
    if (prod.branchStocks && prod.branchStocks.length > 0) {
        const match = prod.branchStocks.find(bs => bs.branchId === bId);
        return match ? parseFloat(match.quantity || 0) : 0;
    }
    // Fallback if branchStocks hasn't populated yet: main branch (ID 1) holds the legacy quantity
    return bId === 1 ? parseFloat(prod.quantity || 0) : 0;
}

export default function ProductManagementClient({ initialProducts = [], initialBranches = [] }) {
    const { data: session, status } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const canView = isAdmin || checkPermission(session, "products", "view") || session?.user?.role === "STAFF" || session?.user?.role === "MANAGER";
    const canCreate = isAdmin || checkPermission(session, "products", "create");
    const canEdit = isAdmin || checkPermission(session, "products", "edit");
    const canDelete = isAdmin || checkPermission(session, "products", "delete");

    const [products, setProducts] = useState(initialProducts);
    const [branches, setBranches] = useState(initialBranches);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Sync when initialProducts updates
    useEffect(() => {
        if (Array.isArray(initialProducts) && initialProducts.length > 0) {
            setProducts(initialProducts);
        }
    }, [initialProducts]);

    // Sync when initialBranches updates
    useEffect(() => {
        if (Array.isArray(initialBranches) && initialBranches.length > 0) {
            setBranches(initialBranches);
        }
    }, [initialBranches]);

    // Fallback fetch if initialProducts is empty
    useEffect(() => {
        if (!initialProducts || initialProducts.length === 0) {
            fetch("/api/products")
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setProducts(data);
                    }
                })
                .catch(err => console.error("Client fetch error:", err));
        }
    }, [initialProducts]);

    // Fallback fetch if branches are empty
    useEffect(() => {
        if (!branches || branches.length === 0) {
            fetch("/api/branches")
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setBranches(data.filter(b => b.isActive !== false));
                    }
                })
                .catch(err => console.error("Client fetch branches error:", err));
        }
    }, [branches]);

    // Active Store / Branch Filter
    // Default to "ALL" so all products and branch stocks are visible by default
    const [selectedBranchId, setSelectedBranchId] = useState("ALL");

    // Reset pagination when search or branch filter changes
    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBranchId]);

    useEffect(() => {
        // Only default to specific branch if non-admin user is explicitly tied to a branch
        if (session?.user?.branchId && session?.user?.role !== "ADMIN") {
            setSelectedBranchId(String(session.user.branchId));
        }
    }, [session?.user?.branchId, session?.user?.role]);

    // Active branch info
    const currentBranch = useMemo(() => {
        if (selectedBranchId === "ALL") return null;
        return branches.find(b => String(b.id) === String(selectedBranchId));
    }, [branches, selectedBranchId]);

    // Filtered products by search
    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return (products || []).filter(prod => {
            if (!query) return true;
            const name = (prod.name ? String(prod.name) : "").toLowerCase();
            const sku = (prod.sku ? String(prod.sku) : "").toLowerCase();
            const barcode = (prod.barcode ? String(prod.barcode) : "").toLowerCase();
            return name.includes(query) || sku.includes(query) || barcode.includes(query);
        });
    }, [products, searchQuery]);

    // Paginated slice
    const paginatedProducts = useMemo(() => {
        if (rowsPerPage === -1) return filteredProducts;
        return filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredProducts, page, rowsPerPage]);

    // Calculate metrics based on selected branch store
    const totalStockQty = useMemo(() => {
        return (filteredProducts || []).reduce((sum, p) => sum + getProductBranchStock(p, selectedBranchId), 0);
    }, [filteredProducts, selectedBranchId]);

    const totalStockCost = useMemo(() => {
        return (filteredProducts || []).reduce((sum, p) => {
            const stock = getProductBranchStock(p, selectedBranchId);
            return sum + (parseFloat(p.costPrice || 0) * stock);
        }, 0);
    }, [filteredProducts, selectedBranchId]);

    const totalStockSale = useMemo(() => {
        return (filteredProducts || []).reduce((sum, p) => {
            const stock = getProductBranchStock(p, selectedBranchId);
            return sum + (parseFloat(p.unitPrice || 0) * stock);
        }, 0);
    }, [filteredProducts, selectedBranchId]);

    // Dialog state for Add / Edit
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProdId, setSelectedProdId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Store Stock Management & Transfer dialog state
    const [stockModalProduct, setStockModalProduct] = useState(null);
    const [stockModalTab, setStockModalTab] = useState(0); // 0: Transfer, 1: Records, 2: Adjust

    // Transfer fields
    const [transferFromBranchId, setTransferFromBranchId] = useState("");
    const [transferToBranchId, setTransferToBranchId] = useState("");
    const [transferQuantity, setTransferQuantity] = useState("");
    const [transferNotes, setTransferNotes] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState("");

    // Transfer records state
    const [productTransfers, setProductTransfers] = useState([]);
    const [loadingProductTransfers, setLoadingProductTransfers] = useState(false);
    const [globalTransfersOpen, setGlobalTransfersOpen] = useState(false);
    const [globalTransfers, setGlobalTransfers] = useState([]);
    const [loadingGlobalTransfers, setLoadingGlobalTransfers] = useState(false);
    const [transferSearchQuery, setTransferSearchQuery] = useState("");
    const [transferFilterBranchId, setTransferFilterBranchId] = useState("ALL");

    // Direct stock adjustment values
    const [quickStockValues, setQuickStockValues] = useState({});
    const [quickStockLoading, setQuickStockLoading] = useState(false);

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        costPrice: "",
        unitPrice: "",
        barcode: "",
        branchStocks: {}, // { [branchId]: quantity }
    });

    const generateBarcode = () => {
        const ts = Date.now().toString().slice(-8);
        const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
        return ts + rand;
    };

    // ── Barcode print state ──────────────────────────────
    const [printProduct, setPrintProduct] = useState(null);
    const [printQty, setPrintQty] = useState(1);
    const [barcodeSvg, setBarcodeSvg] = useState("");

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
        const defaultBranchStocks = {};
        branches.forEach(b => {
            defaultBranchStocks[b.id] = 0;
        });
        setFormData({
            sku: "",
            name: "",
            description: "",
            costPrice: "",
            unitPrice: "",
            barcode: "",
            branchStocks: defaultBranchStocks,
        });
        setEditMode(false);
        setSelectedProdId(null);
        setError("");
    };

    const handleOpen = () => {
        if (!canCreate) {
            setError("You do not have permission to add products.");
            return;
        }
        resetForm();
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) { setOpen(false); resetForm(); }
    };

    const handleEdit = (prod) => {
        if (!canEdit) {
            setError("You do not have permission to edit products.");
            return;
        }
        setEditMode(true);
        setSelectedProdId(prod.id);

        const currentStocks = {};
        branches.forEach(b => {
            currentStocks[b.id] = 0;
        });

        if (prod.branchStocks && prod.branchStocks.length > 0) {
            prod.branchStocks.forEach(bs => {
                currentStocks[bs.branchId] = parseFloat(bs.quantity || 0);
            });
        } else {
            // Assign legacy quantity to main branch
            const firstBranchId = branches[0]?.id || 1;
            currentStocks[firstBranchId] = parseFloat(prod.quantity || 0);
        }

        setFormData({
            sku: prod.sku || "",
            name: prod.name || "",
            description: prod.description || "",
            costPrice: prod.costPrice || "",
            unitPrice: prod.unitPrice || "",
            barcode: prod.barcode || "",
            branchStocks: currentStocks,
        });
        setOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBranchStockChange = (branchId, val) => {
        setFormData(prev => ({
            ...prev,
            branchStocks: {
                ...prev.branchStocks,
                [branchId]: val === "" ? "" : parseFloat(val) || 0
            }
        }));
    };

    const handleSubmit = async () => {
        if (editMode && !canEdit) {
            setError("You do not have permission to edit products.");
            return;
        }
        if (!editMode && !canCreate) {
            setError("You do not have permission to add products.");
            return;
        }

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
        if (!canDelete) {
            alert("You do not have permission to delete products.");
            return;
        }
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

    // ── Store Stock Management & Transfer Handlers ─────────
    const fetchProductTransfers = async (productId) => {
        if (!productId) return;
        setLoadingProductTransfers(true);
        try {
            const res = await fetch(`/api/products/transfer?productId=${productId}&limit=50`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setProductTransfers(data);
            }
        } catch (err) {
            console.error("Failed to fetch product transfers:", err);
        } finally {
            setLoadingProductTransfers(false);
        }
    };

    const handleOpenGlobalTransferRecords = async () => {
        setGlobalTransfersOpen(true);
        setLoadingGlobalTransfers(true);
        try {
            const res = await fetch(`/api/products/transfer?limit=200`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setGlobalTransfers(data);
            }
        } catch (err) {
            console.error("Failed to fetch global transfers:", err);
        } finally {
            setLoadingGlobalTransfers(false);
        }
    };

    const handleOpenStockModal = (prod) => {
        setStockModalProduct(prod);
        setStockModalTab(0);
        setTransferError("");
        setTransferNotes("");
        setTransferQuantity("");

        // Populate direct adjustment values
        const stocks = {};
        branches.forEach(b => {
            stocks[b.id] = getProductBranchStock(prod, b.id);
        });
        setQuickStockValues(stocks);

        // Fetch past transfer records for this product
        fetchProductTransfers(prod.id);

        // 1. Determine Default From Branch (ALWAYS PRE-SELECTED)
        let defaultFromId = "";
        if (selectedBranchId && selectedBranchId !== "ALL" && branches.some(b => String(b.id) === String(selectedBranchId))) {
            defaultFromId = String(selectedBranchId);
        } else if (session?.user?.branchId && branches.some(b => String(b.id) === String(session.user.branchId))) {
            defaultFromId = String(session.user.branchId);
        } else {
            // Find branch with highest stock for this product
            const sortedByStock = [...branches].sort((a, b) => getProductBranchStock(prod, b.id) - getProductBranchStock(prod, a.id));
            if (sortedByStock[0]) {
                defaultFromId = String(sortedByStock[0].id);
            } else if (branches[0]) {
                defaultFromId = String(branches[0].id);
            }
        }

        // 2. Determine Default To Branch (first other branch)
        const otherBranch = branches.find(b => String(b.id) !== String(defaultFromId));
        const defaultToId = otherBranch ? String(otherBranch.id) : "";

        setTransferFromBranchId(defaultFromId);
        setTransferToBranchId(defaultToId);
    };

    // Ensure default From/To branches are always selected even if branches load after modal is opened
    useEffect(() => {
        if (stockModalProduct && branches.length > 0 && !transferFromBranchId) {
            let fromId = "";
            if (selectedBranchId && selectedBranchId !== "ALL" && branches.some(b => String(b.id) === String(selectedBranchId))) {
                fromId = String(selectedBranchId);
            } else if (session?.user?.branchId && branches.some(b => String(b.id) === String(session.user.branchId))) {
                fromId = String(session.user.branchId);
            } else {
                const sorted = [...branches].sort((a, b) => getProductBranchStock(stockModalProduct, b.id) - getProductBranchStock(stockModalProduct, a.id));
                fromId = sorted[0] ? String(sorted[0].id) : String(branches[0].id);
            }
            setTransferFromBranchId(fromId);
            const other = branches.find(b => String(b.id) !== fromId);
            if (other && !transferToBranchId) {
                setTransferToBranchId(String(other.id));
            }
        }
    }, [stockModalProduct, branches, selectedBranchId, session?.user?.branchId, transferFromBranchId, transferToBranchId]);

    const filteredGlobalTransfers = useMemo(() => {
        return (globalTransfers || []).filter(t => {
            if (transferFilterBranchId !== "ALL") {
                const bId = parseInt(transferFilterBranchId);
                if (t.fromBranchId !== bId && t.toBranchId !== bId) return false;
            }
            if (!transferSearchQuery.trim()) return true;
            const q = transferSearchQuery.toLowerCase();
            return (
                (t.productName && t.productName.toLowerCase().includes(q)) ||
                (t.productSku && t.productSku.toLowerCase().includes(q)) ||
                (t.fromBranchName && t.fromBranchName.toLowerCase().includes(q)) ||
                (t.toBranchName && t.toBranchName.toLowerCase().includes(q)) ||
                (t.userName && t.userName.toLowerCase().includes(q)) ||
                (t.notes && t.notes.toLowerCase().includes(q))
            );
        });
    }, [globalTransfers, transferFilterBranchId, transferSearchQuery]);

    const handleExecuteTransfer = async () => {
        if (!stockModalProduct) return;
        const fromId = parseInt(transferFromBranchId);
        const toId = parseInt(transferToBranchId);
        const qty = parseFloat(transferQuantity);

        if (!fromId || !toId) {
            setTransferError("Please select both source and destination branch stores.");
            return;
        }
        if (fromId === toId) {
            setTransferError("Source and destination branch stores cannot be the same.");
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            setTransferError("Please enter a valid transfer quantity greater than 0.");
            return;
        }

        const available = getProductBranchStock(stockModalProduct, fromId);
        if (qty > available) {
            setTransferError(`Cannot transfer ${qty} units. Only ${available} units available in selected source store.`);
            return;
        }

        setTransferLoading(true);
        setTransferError("");
        try {
            const res = await fetch("/api/products/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: stockModalProduct.id,
                    fromBranchId: fromId,
                    toBranchId: toId,
                    quantity: qty,
                    notes: transferNotes.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to transfer stock");
            }

            if (data.product) {
                setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
            }
            setSuccessMessage(data.message || `Transferred ${qty} units successfully!`);
            fetchProductTransfers(stockModalProduct.id);
            setStockModalProduct(null);
        } catch (err) {
            setTransferError(err.message || "Failed to transfer stock");
        } finally {
            setTransferLoading(false);
        }
    };

    const handleSaveQuickStock = async () => {
        if (!stockModalProduct) return;
        setQuickStockLoading(true);
        try {
            const response = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: stockModalProduct.id,
                    sku: stockModalProduct.sku,
                    name: stockModalProduct.name,
                    description: stockModalProduct.description,
                    costPrice: stockModalProduct.costPrice,
                    unitPrice: stockModalProduct.unitPrice,
                    barcode: stockModalProduct.barcode,
                    branchStocks: quickStockValues,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update stock");
            }

            const updatedProd = await response.json();
            setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
            setSuccessMessage(`Stock for "${stockModalProduct.name}" updated successfully!`);
            setStockModalProduct(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setQuickStockLoading(false);
        }
    };

    // Total dialog stock across all branches
    const totalDialogStock = useMemo(() => {
        return Object.values(formData.branchStocks || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }, [formData.branchStocks]);

    if (status === "loading") {
        return (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!canView) {
        return (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2, maxWidth: 600 }}>
                    Access Denied: You do not have permission to view Products.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", p: { xs: 1.5, sm: 3 } }}>

            {/* ── Store Selection Banner & Summary Cards ────────── */}
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                }}
            >
                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                            p: 1.25,
                            bgcolor: "primary.light",
                            color: "primary.main",
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <Store size={22} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="text.primary">
                                {selectedBranchId === "ALL" ? "All Branch Stores (Combined Network)" : `${currentBranch?.name || "Branch"} Store`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedBranchId === "ALL"
                                    ? `Showing consolidated inventory across all ${branches.length} branch stores`
                                    : `Store inventory location: ${currentBranch?.address || "Branch premises"}`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Branch / Store Selector Dropdown */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                            <InputLabel id="branch-store-select-label" sx={{ fontWeight: 600 }}>Active Store</InputLabel>
                            <Select
                                labelId="branch-store-select-label"
                                label="Active Store"
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: selectedBranchId !== "ALL" ? "primary.main" : "divider",
                                    }
                                }}
                            >
                                <MenuItem value="ALL" sx={{ fontWeight: 600 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Layers size={16} color="#6366f1" />
                                        <span>All Branch Stores (Consolidated)</span>
                                    </Box>
                                </MenuItem>
                                <Divider sx={{ my: 0.5 }} />
                                {branches.map((b) => (
                                    <MenuItem key={b.id} value={String(b.id)}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1.5 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Store size={16} color="#059669" />
                                                <span>{b.name} Store</span>
                                            </Box>
                                            {b.code && (
                                                <Chip
                                                    label={b.code}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                                                />
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {/* 3 Metric Cards for Selected Store */}
                {isAdmin && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 2.5,
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "white",
                                borderRadius: 2.5,
                                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.2)",
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            {selectedBranchId === "ALL" ? "Total Network Stock Quantity" : "Store Stock Quantity"}
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                                            {totalStockQty.toLocaleString()} units
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
                                            {filteredProducts.length} unique products
                                        </Typography>
                                    </Box>
                                    <Package size={34} style={{ opacity: 0.8 }} />
                                </Box>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 2.5,
                                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                                color: "white",
                                borderRadius: 2.5,
                                boxShadow: "0 6px 20px rgba(139, 92, 246, 0.2)",
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            Total Stock Cost Value
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                                            Rs. {totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
                                            Inventory purchase value
                                        </Typography>
                                    </Box>
                                    <RefreshCw size={34} style={{ opacity: 0.8 }} />
                                </Box>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 2.5,
                                background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                                color: "white",
                                borderRadius: 2.5,
                                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.2)",
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            Total Stock Retail Value
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                                            Rs. {totalStockSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
                                            Expected retail sales value
                                        </Typography>
                                    </Box>
                                    <Tag size={34} style={{ opacity: 0.8 }} />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Card>

            {/* ── Action bar ─────────────────────────────────── */}
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search by name, code or barcode…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: "100%", sm: 360 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<History size={18} />}
                        onClick={handleOpenGlobalTransferRecords}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 2.5 }}
                    >
                        Transfer Records
                    </Button>
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={handleOpen}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                        >
                            Add Product
                        </Button>
                    )}
                </Box>
            </Box>

            {/* ── Products table ──────────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 720 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Code / Barcode</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                        <Store size={16} />
                                        <span>
                                            {selectedBranchId === "ALL" ? "Branch Stock" : `${currentBranch?.name?.split("-")[0]?.trim() || "Branch"} Store Stock`}
                                        </span>
                                    </Box>
                                </TableCell>
                                {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Cost Price</TableCell>}
                                <TableCell sx={{ fontWeight: 700 }}>Sale Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProducts.length > 0 ? (
                                paginatedProducts.map((prod) => {
                                    const currentStock = getProductBranchStock(prod, selectedBranchId);
                                    const allStoresStock = getProductBranchStock(prod, "ALL");

                                    return (
                                        <TableRow key={prod.id} sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Avatar
                                                        variant="rounded"
                                                        sx={(t) => ({
                                                            width: 38, height: 38,
                                                            bgcolor: t.palette.primary.light,
                                                            color: t.palette.primary.main,
                                                            borderRadius: 1.5,
                                                        })}
                                                    >
                                                        <Package size={20} />
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

                                            {/* Branch Store Stock Column */}
                                            <TableCell sx={{ minWidth: 170 }}>
                                                {selectedBranchId === "ALL" ? (
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            sx={{ color: allStoresStock <= 5 ? "error.main" : "success.main" }}
                                                        >
                                                            {allStoresStock} units (Total)
                                                        </Typography>
                                                        {branches.length > 0 && (
                                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                                                                {branches.map(b => {
                                                                    const bStock = getProductBranchStock(prod, b.id);
                                                                    return (
                                                                        <Chip
                                                                            key={b.id}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            label={`${b.name.split("-")[0].trim()}: ${bStock}`}
                                                                            sx={{
                                                                                fontSize: "0.72rem",
                                                                                height: 20,
                                                                                borderColor: bStock > 0 ? "primary.light" : "grey.300",
                                                                                color: bStock > 0 ? "primary.dark" : "text.disabled",
                                                                                bgcolor: bStock > 0 ? "rgba(99, 102, 241, 0.05)" : "transparent"
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            sx={{ color: currentStock <= 5 ? "error.main" : "success.main" }}
                                                        >
                                                            {currentStock} units
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                            {currentBranch?.name?.split("-")[0]?.trim() || "Branch"} Store
                                                        </Typography>
                                                        {allStoresStock !== currentStock && (
                                                            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
                                                                ({allStoresStock} units network-wide)
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
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
                                                    {canEdit && (
                                                        <Tooltip title="Transfer Stock / Manage Store Stock">
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: "success.main" }}
                                                                onClick={() => handleOpenStockModal(prod)}
                                                            >
                                                                <Store size={17} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Print Barcode Label">
                                                        <IconButton size="small" sx={{ color: "secondary.main" }} onClick={() => handlePrintLabel(prod)}>
                                                            <Printer size={17} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {canEdit && (
                                                        <Tooltip title="Edit Product">
                                                            <IconButton size="small" color="primary" onClick={() => handleEdit(prod)}>
                                                                <Edit size={17} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {canDelete && (
                                                        <Tooltip title="Delete Product">
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(prod.id)}>
                                                                <Trash2 size={17} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredProducts.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: "1px solid", borderColor: "divider" }}
                />
            </Card>

            {/* ── Stock Transfer & Branch Stock Dialog ────────── */}
            <Dialog
                open={!!stockModalProduct}
                onClose={() => !transferLoading && !quickStockLoading && setStockModalProduct(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        overflow: "hidden"
                    }
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{
                        p: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper"
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: "primary.50",
                                color: "primary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <ArrowRightLeft size={22} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                                    Transfer Product Stock
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Move stock between branch stores or adjust store counts
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => !transferLoading && !quickStockLoading && setStockModalProduct(null)}
                            disabled={transferLoading || quickStockLoading}
                        >
                            <XIcon size={18} />
                        </IconButton>
                    </Box>

                    {/* Navigation Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "grey.50", px: 2.5 }}>
                        <Tabs
                            value={stockModalTab}
                            onChange={(e, val) => {
                                setStockModalTab(val);
                                if (val === 1 && stockModalProduct) {
                                    fetchProductTransfers(stockModalProduct.id);
                                }
                            }}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ minHeight: 44 }}
                        >
                            <Tab
                                label="Transfer Between Stores"
                                icon={<ArrowRightLeft size={16} />}
                                iconPosition="start"
                                sx={{ textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.85rem" }}
                            />
                            <Tab
                                label="Transfer Records"
                                icon={<History size={16} />}
                                iconPosition="start"
                                sx={{ textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.85rem" }}
                            />
                            <Tab
                                label="Direct Adjustment"
                                icon={<Store size={16} />}
                                iconPosition="start"
                                sx={{ textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.85rem" }}
                            />
                        </Tabs>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {/* Product Summary Header Card */}
                    <Card
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 2.5,
                            borderRadius: 2,
                            bgcolor: "grey.50",
                            borderColor: "grey.200"
                        }}
                    >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                    {stockModalProduct?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Code / SKU: <strong>{stockModalProduct?.sku}</strong>
                                    {stockModalProduct?.barcode && ` | Barcode: ${stockModalProduct.barcode}`}
                                </Typography>
                            </Box>
                            <Chip
                                label={`${getProductBranchStock(stockModalProduct, "ALL")} units total`}
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                        </Box>

                        <Divider sx={{ my: 1.2 }} />

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Current Stock:
                            </Typography>
                            {branches.map(b => {
                                const bStock = getProductBranchStock(stockModalProduct, b.id);
                                return (
                                    <Chip
                                        key={b.id}
                                        size="small"
                                        variant="outlined"
                                        label={`${b.name}: ${bStock} units`}
                                        sx={{
                                            fontSize: "0.75rem",
                                            bgcolor: bStock > 0 ? "white" : "transparent",
                                            borderColor: bStock > 0 ? "success.light" : "grey.300",
                                            fontWeight: bStock > 0 ? 600 : 400,
                                            color: bStock > 0 ? "success.dark" : "text.secondary"
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Card>

                    {/* TAB 0: TRANSFER STOCK */}
                    {stockModalTab === 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {transferError && (
                                <Alert severity="error" onClose={() => setTransferError("")} sx={{ borderRadius: 2 }}>
                                    {transferError}
                                </Alert>
                            )}

                            {branches.length < 2 && (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    At least 2 active branch stores are required to transfer stock.
                                </Alert>
                            )}

                            {/* From and To Branch Selectors */}
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={5.5}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="from-branch-label">From Branch (Source)</InputLabel>
                                        <Select
                                            labelId="from-branch-label"
                                            value={transferFromBranchId}
                                            label="From Branch (Source)"
                                            onChange={(e) => {
                                                const newFrom = e.target.value;
                                                setTransferFromBranchId(newFrom);
                                                if (newFrom === transferToBranchId) {
                                                    const other = branches.find(b => String(b.id) !== String(newFrom));
                                                    setTransferToBranchId(other ? String(other.id) : "");
                                                }
                                            }}
                                        >
                                            {branches.map(b => {
                                                const stock = getProductBranchStock(stockModalProduct, b.id);
                                                return (
                                                    <MenuItem key={b.id} value={String(b.id)}>
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                                            <span>{b.name}</span>
                                                            <Chip
                                                                size="small"
                                                                label={`${stock} units`}
                                                                sx={{
                                                                    ml: 1,
                                                                    height: 20,
                                                                    fontSize: "0.7rem",
                                                                    bgcolor: stock > 0 ? "success.50" : "grey.100",
                                                                    color: stock > 0 ? "success.dark" : "text.disabled",
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                    {transferFromBranchId && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                mt: 0.5,
                                                display: "block",
                                                color: getProductBranchStock(stockModalProduct, transferFromBranchId) > 0 ? "success.main" : "error.main",
                                                fontWeight: 600
                                            }}
                                        >
                                            Available to transfer: {getProductBranchStock(stockModalProduct, transferFromBranchId)} units
                                        </Typography>
                                    )}
                                </Grid>

                                <Grid item xs={12} sm={1} sx={{ display: "flex", justifyContent: "center" }}>
                                    <Box sx={{
                                        p: 0.75,
                                        borderRadius: "50%",
                                        bgcolor: "primary.50",
                                        color: "primary.main",
                                        display: { xs: "none", sm: "flex" },
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <ArrowRight size={18} />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={5.5}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="to-branch-label">To Branch (Destination)</InputLabel>
                                        <Select
                                            labelId="to-branch-label"
                                            value={transferToBranchId}
                                            label="To Branch (Destination)"
                                            onChange={(e) => setTransferToBranchId(e.target.value)}
                                        >
                                            {branches.map(b => {
                                                const isSame = String(b.id) === String(transferFromBranchId);
                                                const stock = getProductBranchStock(stockModalProduct, b.id);
                                                return (
                                                    <MenuItem key={b.id} value={String(b.id)} disabled={isSame}>
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                                            <span>{b.name} {isSame ? "(Source)" : ""}</span>
                                                            <Chip
                                                                size="small"
                                                                label={`${stock} units`}
                                                                sx={{ ml: 1, height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                                                            />
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                    {transferToBranchId && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                            Current store stock: {getProductBranchStock(stockModalProduct, transferToBranchId)} units
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>

                            {/* Transfer Quantity */}
                            <Box sx={{ mt: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Quantity to Transfer"
                                    placeholder="Enter units to move..."
                                    value={transferQuantity}
                                    onChange={(e) => setTransferQuantity(e.target.value)}
                                    inputProps={{
                                        step: "any",
                                        min: 0.01,
                                        max: transferFromBranchId ? getProductBranchStock(stockModalProduct, transferFromBranchId) : undefined
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {transferFromBranchId && getProductBranchStock(stockModalProduct, transferFromBranchId) > 0 && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => setTransferQuantity(String(getProductBranchStock(stockModalProduct, transferFromBranchId)))}
                                                        sx={{ fontSize: "0.75rem", p: 0.5, minWidth: "auto", fontWeight: 700 }}
                                                    >
                                                        Max ({getProductBranchStock(stockModalProduct, transferFromBranchId)})
                                                    </Button>
                                                )}
                                                <Typography variant="caption" sx={{ ml: 0.5, color: "text.disabled" }}>
                                                    units
                                                </Typography>
                                            </InputAdornment>
                                        )
                                    }}
                                    error={
                                        Boolean(transferQuantity) &&
                                        (parseFloat(transferQuantity) <= 0 ||
                                         parseFloat(transferQuantity) > (transferFromBranchId ? getProductBranchStock(stockModalProduct, transferFromBranchId) : 0))
                                    }
                                    helperText={
                                        Boolean(transferQuantity) && parseFloat(transferQuantity) > (transferFromBranchId ? getProductBranchStock(stockModalProduct, transferFromBranchId) : 0)
                                            ? `Transfer quantity exceeds available stock (${getProductBranchStock(stockModalProduct, transferFromBranchId)} units)`
                                            : ""
                                    }
                                />
                            </Box>

                            {/* Live Transfer Preview */}
                            {transferFromBranchId &&
                             transferToBranchId &&
                             transferFromBranchId !== transferToBranchId &&
                             parseFloat(transferQuantity) > 0 &&
                             parseFloat(transferQuantity) <= getProductBranchStock(stockModalProduct, transferFromBranchId) && (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: "rgba(99, 102, 241, 0.04)",
                                        border: "1px dashed",
                                        borderColor: "primary.light"
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        Preview Transfer Result:
                                    </Typography>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {branches.find(b => String(b.id) === String(transferFromBranchId))?.name}:
                                            </Typography>
                                            <Typography variant="caption" color="error.main" fontWeight={700}>
                                                {getProductBranchStock(stockModalProduct, transferFromBranchId)} → {getProductBranchStock(stockModalProduct, transferFromBranchId) - parseFloat(transferQuantity)} units (-{parseFloat(transferQuantity)})
                                            </Typography>
                                        </Box>
                                        <ArrowRight size={18} color="#6366f1" />
                                        <Box sx={{ textAlign: "right" }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {branches.find(b => String(b.id) === String(transferToBranchId))?.name}:
                                            </Typography>
                                            <Typography variant="caption" color="success.main" fontWeight={700}>
                                                {getProductBranchStock(stockModalProduct, transferToBranchId)} → {getProductBranchStock(stockModalProduct, transferToBranchId) + parseFloat(transferQuantity)} units (+{parseFloat(transferQuantity)})
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {/* Notes Field */}
                            <TextField
                                fullWidth
                                size="small"
                                label="Transfer Reason / Notes (Optional)"
                                placeholder="e.g. Sent with driver, restocking branch store..."
                                value={transferNotes}
                                onChange={(e) => setTransferNotes(e.target.value)}
                            />
                        </Box>
                    )}

                    {/* TAB 1: PRODUCT TRANSFER RECORDS */}
                    {stockModalTab === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Transfer History for {stockModalProduct?.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => fetchProductTransfers(stockModalProduct?.id)}
                                    disabled={loadingProductTransfers}
                                >
                                    <RefreshCw size={15} />
                                </IconButton>
                            </Box>

                            {loadingProductTransfers ? (
                                <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                                    <CircularProgress size={26} />
                                </Box>
                            ) : productTransfers.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                                    <ArrowRightLeft size={36} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                                    <Typography variant="body2" fontWeight={500}>
                                        No transfer records found for this product.
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        Completed transfers between stores will be recorded here automatically.
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 320 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Route</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Quantity</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Transferred By</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Notes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {productTransfers.map((item) => (
                                                <TableRow key={item.id} hover>
                                                    <TableCell sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                                        {new Date(item.createdAt).toLocaleDateString()}{" "}
                                                        <span style={{ color: "#9ca3af", fontSize: "0.7rem" }}>
                                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "0.75rem" }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Chip label={item.fromBranchCode || item.fromBranchName} size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "error.50", color: "error.dark", fontWeight: 600 }} />
                                                            <ArrowRight size={12} color="#9ca3af" />
                                                            <Chip label={item.toBranchCode || item.toBranchName} size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "success.50", color: "success.dark", fontWeight: 600 }} />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: "primary.main" }}>
                                                        {item.quantity} units
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "0.75rem" }}>
                                                        {item.userName || "Admin"}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.notes || "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* TAB 2: DIRECT STOCK ADJUSTMENT */}
                    {stockModalTab === 2 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Directly set or calibrate exact stock quantities for each branch store:
                            </Typography>
                            {branches.map(b => (
                                <Box key={b.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Store size={15} color="#4f46e5" />
                                            <Typography variant="body2" fontWeight={600}>
                                                {b.name} Store
                                            </Typography>
                                        </Box>
                                        {b.code && <Chip label={b.code} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />}
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Stock Quantity"
                                        value={quickStockValues[b.id] ?? 0}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setQuickStockValues(prev => ({
                                                ...prev,
                                                [b.id]: val === "" ? "" : parseFloat(val) || 0
                                            }));
                                        }}
                                        inputProps={{ step: "any", min: 0 }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setStockModalProduct(null)}
                        variant="outlined"
                        color="inherit"
                        disabled={transferLoading || quickStockLoading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>

                    {stockModalTab === 0 && (
                        <Button
                            variant="contained"
                            onClick={handleExecuteTransfer}
                            disabled={
                                transferLoading ||
                                !transferFromBranchId ||
                                !transferToBranchId ||
                                transferFromBranchId === transferToBranchId ||
                                !transferQuantity ||
                                parseFloat(transferQuantity) <= 0 ||
                                parseFloat(transferQuantity) > getProductBranchStock(stockModalProduct, transferFromBranchId)
                            }
                            startIcon={transferLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowRightLeft size={16} />}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                        >
                            {transferLoading ? "Transferring..." : "Transfer Stock"}
                        </Button>
                    )}

                    {stockModalTab === 2 && (
                        <Button
                            variant="contained"
                            onClick={handleSaveQuickStock}
                            disabled={quickStockLoading}
                            startIcon={quickStockLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                        >
                            {quickStockLoading ? "Saving..." : "Save Stock"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ── Global Stock Transfer Records Dialog ────────── */}
            <Dialog
                open={globalTransfersOpen}
                onClose={() => setGlobalTransfersOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        overflow: "hidden"
                    }
                }}
            >
                <DialogTitle sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "primary.50",
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <History size={22} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                                Stock Transfer Records
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Complete log of inventory transfers across all store branches ({filteredGlobalTransfers.length} records)
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={handleOpenGlobalTransferRecords}
                            disabled={loadingGlobalTransfers}
                        >
                            <RefreshCw size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => setGlobalTransfersOpen(false)}>
                            <XIcon size={18} />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5 }}>
                    {/* Filters */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
                        <TextField
                            size="small"
                            placeholder="Filter by product, SKU, branch, or notes…"
                            value={transferSearchQuery}
                            onChange={(e) => setTransferSearchQuery(e.target.value)}
                            sx={{ flex: 1, minWidth: 220 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start"><Search size={16} /></InputAdornment>
                                )
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel id="filter-transfer-branch-label">Store Branch</InputLabel>
                            <Select
                                labelId="filter-transfer-branch-label"
                                label="Store Branch"
                                value={transferFilterBranchId}
                                onChange={(e) => setTransferFilterBranchId(e.target.value)}
                            >
                                <MenuItem value="ALL">All Branches</MenuItem>
                                {branches.map(b => (
                                    <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Records Table */}
                    {loadingGlobalTransfers ? (
                        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : filteredGlobalTransfers.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
                            <History size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                            <Typography variant="body1" fontWeight={600}>
                                No stock transfer records found.
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                When stock is transferred between branch stores, audit records will be listed here.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 440 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "grey.50" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Transfer Route</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Transferred By</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Notes / Reason</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredGlobalTransfers.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                                                {new Date(item.createdAt).toLocaleDateString()}{" "}
                                                <Typography component="span" variant="caption" sx={{ color: "text.disabled", display: "block" }}>
                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.productName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {item.productSku}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                    <Chip
                                                        label={item.fromBranchName}
                                                        size="small"
                                                        sx={{ fontSize: "0.7rem", bgcolor: "error.50", color: "error.dark", fontWeight: 600 }}
                                                    />
                                                    <ArrowRight size={14} color="#9ca3af" />
                                                    <Chip
                                                        label={item.toBranchName}
                                                        size="small"
                                                        sx={{ fontSize: "0.7rem", bgcolor: "success.50", color: "success.dark", fontWeight: 600 }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                                    {item.quantity} units
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: "0.8rem" }}>
                                                {item.userName || "System / Admin"}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary", maxWidth: 180 }}>
                                                {item.notes || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
                    <Button
                        onClick={() => setGlobalTransfersOpen(false)}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

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
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                        <Grid size={{ xs: 12, sm: isAdmin ? 6 : 12 }}>
                            <TextField
                                fullWidth size="small" label="Sale Price" name="unitPrice" type="number" required
                                placeholder="0.00"
                                value={formData.unitPrice}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Grid>

                        {/* ── Branch Store Inventory Section ──────── */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{
                                p: 2,
                                bgcolor: "grey.50",
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider"
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Store size={18} color="#4f46e5" />
                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                            Store Inventory (Stock per Branch)
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        color="primary"
                                        variant="filled"
                                        label={`Total Stock: ${totalDialogStock} units`}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>

                                <Grid container spacing={1.5}>
                                    {branches.map((b) => (
                                        <Grid size={{ xs: 12, sm: branches.length > 1 ? 6 : 12 }} key={b.id}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                label={`${b.name} Store`}
                                                value={formData.branchStocks[b.id] ?? 0}
                                                onChange={(e) => handleBranchStockChange(b.id, e.target.value)}
                                                inputProps={{ step: "any", min: 0 }}
                                                helperText={b.code ? `Branch Code: ${b.code}` : undefined}
                                                sx={{ bgcolor: "white" }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
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
                        disabled={loading || !formData.name?.trim() || !formData.sku?.trim() || (editMode ? !canEdit : !canCreate)}
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
