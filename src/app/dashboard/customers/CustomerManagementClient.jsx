"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Divider,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination,
    LinearProgress,
    TableSortLabel,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Phone,
    MapPin,
    Ruler,
    Plus,
    User,
    Users,
    BookText,
    Tag,
    Camera,
    X,
} from "lucide-react";

export default function CustomerManagementClient({ initialCustomers, initialTotalCount, accountCategories }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [categories, setCategories] = useState(accountCategories);
    const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [listLoading, setListLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterMeasurementNo, setFilterMeasurementNo] = useState("");
    const [debouncedMeasurementNo, setDebouncedMeasurementNo] = useState("");

    // Sorting State
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const handleRequestSort = (property) => {
        const isAsc = sortBy === property && sortOrder === "asc";
        setSortOrder(isAsc ? "desc" : "asc");
        setSortBy(property);
        setPage(0); // Reset page to first page when sort changes
    };

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0); // Reset to first page on search change
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Debounce measurement filter
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedMeasurementNo(filterMeasurementNo);
            setPage(0); // Reset to first page on measurement filter change
        }, 400);
        return () => clearTimeout(handler);
    }, [filterMeasurementNo]);

    // Reset page on category filter change
    useEffect(() => {
        setPage(0);
    }, [filterCategory]);

    // Paginated fetching effect
    useEffect(() => {
        let active = true;
        const load = async () => {
            setListLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    page: (page + 1).toString(),
                    limit: rowsPerPage.toString(),
                    search: debouncedSearch,
                    categoryId: filterCategory ? filterCategory.id.toString() : "",
                    measurementNo: debouncedMeasurementNo,
                    sortBy,
                    sortOrder,
                });
                const res = await fetch(`/api/customers?${queryParams.toString()}`);
                if (res.ok && active) {
                    const data = await res.json();
                    setCustomers(data.customers || []);
                    setTotalCount(data.totalCount || 0);
                }
            } catch (err) {
                console.error("Error fetching customers:", err);
            } finally {
                if (active) setListLoading(false);
            }
        };

        // Skip fetch on initial mount if page=0 and no filters, as initialCustomers is already populated.
        const isInitial = page === 0 && rowsPerPage === 50 && !debouncedSearch && !filterCategory && !debouncedMeasurementNo && sortBy === "createdAt" && sortOrder === "desc";
        if (!isInitial || refreshTrigger > 0) {
            load();
        }

        return () => {
            active = false;
        };
    }, [page, rowsPerPage, debouncedSearch, filterCategory, debouncedMeasurementNo, sortBy, sortOrder, refreshTrigger]);

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Ledger dialog state
    const [ledgerOpen, setLedgerOpen] = useState(false);
    const [ledgerCustomer, setLedgerCustomer] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [ledgerDateFrom, setLedgerDateFrom] = useState("");
    const [ledgerDateTo, setLedgerDateTo] = useState("");

    // Quick Add Category State
    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatLoading, setNewCatLoading] = useState(false);

    // Form Dialog State
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Image upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // First category in the list as default
    const getDefaultCategoryId = (cats) => {
        return (cats || []).length > 0 ? cats[0].id : null;
    };

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        measurementNo: "",
        phone: "",
        address: "",
        accountCategoryId: getDefaultCategoryId(accountCategories),
        notes: "",
        balance: 0,
    });

    const resetForm = () => {
        setFormData({
            name: "",
            fatherName: "",
            measurementNo: "",
            phone: "",
            address: "",
            code: "",
            accountCategoryId: getDefaultCategoryId(categories),
            notes: "",
            balance: 0,
        });
        setImageFile(null);
        setImagePreview(null);
        setError("");
        setLoading(false);
    };

    const handleOpen = () => {
        resetForm();
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) {
            setShowForm(false);
            resetForm();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            if (value === "" || /^[0-9]+$/.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData((prev) => ({ ...prev, image: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let imageUrl = formData.image || null;

            // Upload new image if selected
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append("file", imageFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
                if (!uploadRes.ok) {
                    const d = await uploadRes.json();
                    throw new Error(d.error || "Image upload failed");
                }
                const uploadJson = await uploadRes.json();
                imageUrl = uploadJson.url;
            } else if (imagePreview === null) {
                imageUrl = null; // explicitly removed
            }

            const isEditing = formData.id;
            const url = isEditing ? `/api/customers/${formData.id}` : "/api/customers";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, image: imageUrl }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} customer`);
            }

            const savedCustomer = await response.json();
            const updatedCategory = categories.find((c) => c.id === savedCustomer.accountCategoryId);
            const customerWithRelations = {
                ...savedCustomer,
                accountCategory: updatedCategory || savedCustomer.accountCategory,
            };

            if (isEditing) {
                const oldCustomer = customers.find((c) => c.id === savedCustomer.id);
                if (oldCustomer && oldCustomer.accountCategoryId !== savedCustomer.accountCategoryId) {
                    setCategories((prev) => prev.map((cat) => {
                        if (cat.id === oldCustomer.accountCategoryId) {
                            return { ...cat, _count: { ...cat._count, customers: Math.max(0, (cat._count?.customers || 0) - 1) } };
                        }
                        if (cat.id === savedCustomer.accountCategoryId) {
                            return { ...cat, _count: { ...cat._count, customers: (cat._count?.customers || 0) + 1 } };
                        }
                        return cat;
                    }));
                }
                setCustomers((prev) => prev.map((c) => (c.id === savedCustomer.id ? customerWithRelations : c)));
                setSuccessMessage("Customer updated successfully!");
            } else {
                setTotalCount((prev) => prev + 1);
                if (savedCustomer.accountCategoryId) {
                    setCategories((prev) => prev.map((cat) => {
                        if (cat.id === savedCustomer.accountCategoryId) {
                            return { ...cat, _count: { ...cat._count, customers: (cat._count?.customers || 0) + 1 } };
                        }
                        return cat;
                    }));
                }
                setCustomers((prev) => {
                    const list = [customerWithRelations, ...prev];
                    if (list.length > rowsPerPage) {
                        list.pop();
                    }
                    return list;
                });
                setSuccessMessage("Customer added successfully!");
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddCategory = async () => {
        if (!newCatName.trim()) return;
        setNewCatLoading(true);
        try {
            const response = await fetch("/api/account-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add category");
            }

            const savedCat = await response.json();
            setCategories((prev) => [...prev, savedCat].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData((prev) => ({ ...prev, accountCategoryId: savedCat.id }));
            setSuccessMessage("Category added successfully!");
            setQuickAddCatOpen(false);
            setNewCatName("");
        } catch (err) {
            setError(err.message);
        } finally {
            setNewCatLoading(false);
        }
    };

    const handleEdit = (customer) => {
        setFormData({
            id: customer.id,
            name: customer.name,
            fatherName: customer.fatherName || "",
            measurementNo: customer.measurementNo || "",
            phone: customer.phone || "",
            address: customer.address || "",
            code: customer.code || "",
            accountCategoryId: customer.accountCategoryId || (categories.length > 0 ? categories[0].id : null),
            notes: customer.notes || "",
            balance: customer.balance || 0,
            image: customer.image || null,
        });
        setImageFile(null);
        setImagePreview(customer.image || null);
        setShowForm(true);
    };

    // Secure delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [confirmName, setConfirmName] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleOpenDeleteDialog = (customer) => {
        setCustomerToDelete(customer);
        setConfirmName("");
        setDeleteDialogOpen(true);
    };

    const handlePermanentDelete = async () => {
        if (!customerToDelete || confirmName.trim() !== customerToDelete.name.trim()) return;
        setDeleteLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/customers/${customerToDelete.id}?cascade=true`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete customer");
            }

            setTotalCount((prev) => Math.max(0, prev - 1));
            if (customerToDelete.accountCategoryId) {
                setCategories((prev) => prev.map((cat) => {
                    if (cat.id === customerToDelete.accountCategoryId) {
                        return { ...cat, _count: { ...cat._count, customers: Math.max(0, (cat._count?.customers || 0) - 1) } };
                    }
                    return cat;
                }));
            }

            setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
            setSuccessMessage("Customer deleted successfully!");
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
            setConfirmName("");
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePrintLedger = () => {
        if (!ledgerCustomer) return;

        // Calculate opening balance
        let openingBalance = 0;
        const sortedAllEntries = ledgerEntries.slice().sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id);

        if (ledgerDateFrom) {
            sortedAllEntries.forEach(entry => {
                const entryDay = entry.entryDate ? new Date(entry.entryDate).toISOString().split("T")[0] : "";
                if (entryDay < ledgerDateFrom) {
                    const amt = parseFloat(entry.amount || 0);
                    if (entry.type === "DEBIT") openingBalance += amt;
                    else openingBalance -= amt;
                }
            });
        }

        // Filter and sort for the active period
        const filtered = ledgerEntries.filter(entry => {
            const entryDay = entry.entryDate ? new Date(entry.entryDate).toISOString().split("T")[0] : "";
            const matchesFrom = !ledgerDateFrom || entryDay >= ledgerDateFrom;
            const matchesTo = !ledgerDateTo || entryDay <= ledgerDateTo;
            return matchesFrom && matchesTo;
        });
        const sortedFiltered = filtered.slice().sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id);

        let running = openingBalance;
        const fmt = (n) => "Rs. " + Math.abs(n).toFixed(2) + (n > 0 ? " Cr" : n < 0 ? " Dr" : "");
        const fmtAmt = (n) => "Rs. " + n.toFixed(2);
        const dateLabel = (d) => new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

        let rowsHtml = "";

        // If there's an opening balance date, add the Brought Forward row
        if (ledgerDateFrom) {
            rowsHtml += `
                <tr class="opening-row" style="background-color: #f1f5f9; font-style: italic; font-weight: bold;">
                    <td>—</td>
                    <td>${dateLabel(ledgerDateFrom)}</td>
                    <td>Opening Balance (Brought Forward)</td>
                    <td class="amount">—</td>
                    <td class="amount">—</td>
                    <td class="amount ${openingBalance >= 0 ? "cr" : "dr"}">${fmt(openingBalance)}</td>
                </tr>`;
        }

        rowsHtml += sortedFiltered.map((entry, idx) => {
            const amt = parseFloat(entry.amount || 0);
            if (entry.type === "DEBIT") running += amt;
            else running -= amt;
            const runLabel = fmt(running);
            const date = dateLabel(entry.entryDate);
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${date}</td>
                    <td>${entry.description || "—"}</td>
                    <td class="amount">${entry.type === "DEBIT" ? fmtAmt(amt) : "—"}</td>
                    <td class="amount">${entry.type === "CREDIT" ? fmtAmt(amt) : "—"}</td>
                    <td class="amount ${running >= 0 ? "cr" : "dr"}">${runLabel}</td>
                </tr>`;
        }).join("");

        const printDate = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
        const totalDebit = sortedFiltered.reduce((s, e) => e.type === "DEBIT" ? s + parseFloat(e.amount || 0) : s, 0);
        const totalCredit = sortedFiltered.reduce((s, e) => e.type === "CREDIT" ? s + parseFloat(e.amount || 0) : s, 0);
        const finalBalance = running;
        const balanceLabel = fmt(finalBalance);

        // Period string
        const periodStr = [
            ledgerDateFrom ? `From: ${dateLabel(ledgerDateFrom)}` : null,
            ledgerDateTo ? `To: ${dateLabel(ledgerDateTo)}` : null,
        ].filter(Boolean).join("  –  ") || "All Time";

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Account Ledger — ${ledgerCustomer.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 30px 36px; }

  /* ── TOP HEADER ── */
  .page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
  .brand { display: flex; flex-direction: column; }
  .shop-name { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #1e293b; line-height: 1; }
  .shop-tagline { font-size: 11px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px; }
  .shop-contact { text-align: right; font-size: 11px; color: #475569; line-height: 1.8; }
  .doc-title { text-align: center; flex: 1; }
  .doc-title-text { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1e293b; border: 2px solid #1e293b; display: inline-block; padding: 4px 18px; border-radius: 3px; }

  /* ── CUSTOMER INFO BOX ── */
  .info-section { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; gap: 20px; }
  .info-block { display: flex; flex-direction: column; gap: 3px; }
  .info-block .row { display: flex; gap: 6px; align-items: baseline; }
  .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; min-width: 72px; }
  .info-value { font-size: 12px; font-weight: 600; color: #1e293b; }
  .balance-box { align-self: center; text-align: right; padding: 10px 16px; border-radius: 6px; border: 2px solid; }
  .balance-box.cr { border-color: #15803d; background: #f0fdf4; }
  .balance-box.dr { border-color: #b91c1c; background: #fef2f2; }
  .balance-box .bal-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .balance-box .bal-amount { font-size: 18px; font-weight: 900; margin-top: 2px; }
  .balance-box.cr .bal-label, .balance-box.cr .bal-amount { color: #15803d; }
  .balance-box.dr .bal-label, .balance-box.dr .bal-amount { color: #b91c1c; }

  /* ── TABLE ── */
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  thead tr { background: #1e293b; }
  thead th { color: #fff; font-weight: 700; padding: 8px 10px; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #1e293b; }
  thead th.amount { text-align: right; }
  tbody td { padding: 6px 10px; border: 1px solid #e2e8f0; vertical-align: middle; color: #374151; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tbody tr:hover td { background: #eff6ff; }
  td.amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.mono { font-family: monospace; color: #64748b; font-size: 11px; }
  .cr { color: #15803d; font-weight: 700; }
  .dr { color: #b91c1c; font-weight: 700; }

  /* ── TOTALS ROW ── */
  .totals-row td { background: #f1f5f9 !important; font-weight: 700; border-top: 2px solid #1e293b; font-size: 11.5px; }

  /* ── FOOTER ── */
  .page-footer { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig-block { text-align: center; }
  .sig-line { width: 160px; border-top: 1.5px solid #475569; margin: 0 auto 4px; }
  .sig-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .print-note { font-size: 9.5px; color: #94a3b8; text-align: right; }

  @media print {
    body { padding: 18px 24px; }
    @page { size: A4; margin: 12mm; }
    tbody tr:hover td { background: inherit; }
  }
</style>
</head>
<body>

  <!-- PAGE HEADER -->
  <div class="page-header">
    <div class="brand">
      <div class="shop-name">Grace Tailors</div>
      <div class="shop-tagline">Premium Stitching &amp; Tailoring Services</div>
    </div>
    <div class="doc-title">
      <div class="doc-title-text">Account Ledger</div>
    </div>
    <div class="shop-contact">
      <strong>Grace Tailors</strong><br/>
      Print Date: ${printDate}
    </div>
  </div>

  <!-- CUSTOMER INFO -->
  <div class="info-section">
    <div style="display:flex; gap:40px; flex:1;">
      <div class="info-block">
        <div class="row"><span class="info-label">Customer</span><span class="info-value">${ledgerCustomer.name}</span></div>
        ${ledgerCustomer.phone ? `<div class="row"><span class="info-label">Phone</span><span class="info-value">${ledgerCustomer.phone}</span></div>` : ""}
        ${ledgerCustomer.address ? `<div class="row"><span class="info-label">Address</span><span class="info-value">${ledgerCustomer.address}</span></div>` : ""}
      </div>
      <div class="info-block">
        ${ledgerCustomer.measurementNo ? `<div class="row"><span class="info-label">M. No</span><span class="info-value">${ledgerCustomer.measurementNo}</span></div>` : ""}
        <div class="row"><span class="info-label">Entries</span><span class="info-value">${sortedFiltered.length}</span></div>
        <div class="row"><span class="info-label">Period</span><span class="info-value">${periodStr}</span></div>
      </div>
    </div>
    <div class="balance-box ${finalBalance >= 0 ? "cr" : "dr"}">
      <div class="bal-label">Closing Balance</div>
      <div class="bal-amount">${balanceLabel}</div>
    </div>
  </div>

  <!-- LEDGER TABLE -->
  <table>
    <thead>
      <tr>
        <th style="width:34px">#</th>
        <th style="width:96px">Date</th>
        <th>Description</th>
        <th class="amount" style="width:110px">Debit (Dr)</th>
        <th class="amount" style="width:110px">Credit (Cr)</th>
        <th class="amount" style="width:120px">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="totals-row">
        <td colspan="3" style="text-align:right; text-transform:uppercase; letter-spacing:0.5px; font-size:10.5px;">Total</td>
        <td class="amount dr">Rs. ${totalDebit.toFixed(2)}</td>
        <td class="amount cr">Rs. ${totalCredit.toFixed(2)}</td>
        <td class="amount ${finalBalance >= 0 ? "cr" : "dr"}">${balanceLabel}</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE FOOTER -->
  <div class="page-footer">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Prepared By</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Authorized By</div>
    </div>
    <div class="print-note">
      This is a computer-generated ledger.<br/>
      Printed on ${printDate} &nbsp;|&nbsp; Grace Tailors
    </div>
  </div>

</body>
</html>`;

        const win = window.open("", "_blank", "width=900,height=700");
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 400);
    };

    const handleOpenLedger = async (customer) => {
        setLedgerCustomer(customer);
        setLedgerEntries([]);
        setLedgerOpen(true);
        setLedgerLoading(true);
        setLedgerDateFrom("");
        setLedgerDateTo("");
        try {
            const res = await fetch(`/api/ledger?customerId=${customer.id}`);
            const data = await res.json();
            setLedgerEntries(Array.isArray(data) ? data : []);
        } catch {
            setLedgerEntries([]);
        } finally {
            setLedgerLoading(false);
        }
    };

    const filteredCustomers = customers || [];

    const customerCategories = (categories || []).filter(
        (cat) =>
            !(cat.name || "").toLowerCase().includes("cutter") &&
            !(cat.name || "").toLowerCase().includes("tailor")
    );

    const categoryStats = customerCategories.map((cat) => ({
        ...cat,
        count: cat._count?.customers || 0,
    }));

    const statColors = [
        { bg: "primary.light", color: "primary.main" },
        { bg: "success.light", color: "success.main" },
        { bg: "info.light", color: "info.main" },
        { bg: "warning.light", color: "warning.main" },
        { bg: "secondary.light", color: "secondary.main" },
    ];

    // Calculate ledger filters and opening balance
    const sortedAllLedgerEntries = ledgerEntries.slice().sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id);
    let openingBalance = 0;
    if (ledgerDateFrom) {
        sortedAllLedgerEntries.forEach(entry => {
            const entryDay = entry.entryDate ? new Date(entry.entryDate).toISOString().split("T")[0] : "";
            if (entryDay < ledgerDateFrom) {
                const amt = parseFloat(entry.amount || 0);
                if (entry.type === "DEBIT") openingBalance += amt;
                else openingBalance -= amt;
            }
        });
    }

    const sortedFilteredEntries = ledgerEntries.filter(entry => {
        const entryDay = entry.entryDate ? new Date(entry.entryDate).toISOString().split("T")[0] : "";
        const matchesFrom = !ledgerDateFrom || entryDay >= ledgerDateFrom;
        const matchesTo = !ledgerDateTo || entryDay <= ledgerDateTo;
        return matchesFrom && matchesTo;
    }).sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id);

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Summary Cards ─────────────────────────────── */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                {/* Total Customers */}
                <Box sx={{ flex: "1 1 0%", minWidth: 0 }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            color: "white",
                            boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
                            height: "100%",
                        }}
                    >
                        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Total Customers
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    {totalCount}
                                </Typography>
                                <Box sx={{ bgcolor: "rgba(255,255,255,0.2)", p: 1, borderRadius: 2 }}>
                                    <Users size={22} color="white" />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Category Stats */}
                {categoryStats.map((stat, idx) => {
                    const c = statColors[idx % statColors.length];
                    return (
                        <Box key={stat.id} sx={{ flex: "1 1 0%", minWidth: 0 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    height: "100%",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
                                }}
                            >
                                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        {stat.name}
                                    </Typography>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                                            {stat.count}
                                        </Typography>
                                        <Box sx={{ bgcolor: c.bg, color: c.color, p: 1, borderRadius: 2 }}>
                                            <User size={20} />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Box>

            {/* ── Action Bar ────────────────────────────────── */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 3 }}
            >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1, flexWrap: "wrap" }}>
                    <TextField
                        placeholder="Name, phone, address, M#…"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ color: "text.secondary", mr: 1 }}>
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 260, bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <TextField
                        placeholder="Filter by M#…"
                        variant="outlined"
                        size="small"
                        value={filterMeasurementNo}
                        onChange={(e) => setFilterMeasurementNo(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ color: "text.secondary", mr: 1 }}>
                                    <Ruler size={16} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 180, bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <Autocomplete
                        options={customerCategories}
                        getOptionLabel={(option) => option.name || ""}
                        value={filterCategory}
                        onChange={(e, newValue) => setFilterCategory(newValue)}
                        sx={{ minWidth: 220 }}
                        ListboxProps={{ style: { minWidth: 220 } }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Filter by Category"
                                size="small"
                                sx={{ bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                            />
                        )}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="sort-by-label">Sort By</InputLabel>
                        <Select
                            labelId="sort-by-label"
                            label="Sort By"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(0);
                            }}
                            sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                        >
                            <MenuItem value="createdAt">Date Created</MenuItem>
                            <MenuItem value="name">Name</MenuItem>
                            <MenuItem value="fatherName">Father's Name</MenuItem>
                            <MenuItem value="measurementNo">Measurement No</MenuItem>
                            <MenuItem value="balance">Balance</MenuItem>
                            <MenuItem value="phone">Phone</MenuItem>
                            <MenuItem value="address">Address</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="sort-order-label">Sort Order</InputLabel>
                        <Select
                            labelId="sort-order-label"
                            label="Sort Order"
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value);
                                setPage(0);
                            }}
                            sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                        >
                            <MenuItem value="asc">A to Z (Ascending)</MenuItem>
                            <MenuItem value="desc">Z to A (Descending)</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, whiteSpace: "nowrap" }}
                >
                    Add New Customer
                </Button>
            </Stack>

            {/* ── Customers Table ───────────────────────────── */}
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
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "name"}
                                    direction={sortBy === "name" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("name")}
                                >
                                    Customer
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "fatherName"}
                                    direction={sortBy === "fatherName" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("fatherName")}
                                >
                                    Father's Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "measurementNo"}
                                    direction={sortBy === "measurementNo" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("measurementNo")}
                                >
                                    M#
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "balance"}
                                    direction={sortBy === "balance" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("balance")}
                                >
                                    Balance
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "phone"}
                                    direction={sortBy === "phone" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("phone")}
                                >
                                    Phone
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                                <TableSortLabel
                                    active={sortBy === "address"}
                                    direction={sortBy === "address" ? sortOrder : "asc"}
                                    onClick={() => handleRequestSort("address")}
                                >
                                    Address
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    hover
                                    sx={{ transition: "background-color 0.15s" }}
                                >
                                    {/* Customer Name */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar
                                                src={customer.image || undefined}
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    width: 38,
                                                    height: 38,
                                                    fontSize: "0.9rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {!customer.image && customer.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {customer.name}
                                                </Typography>
                                                <Chip
                                                    label={customer.accountCategory?.name || "N/A"}
                                                    size="small"
                                                    sx={{ height: 18, fontSize: "0.65rem", mt: 0.3 }}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Father's Name */}
                                    <TableCell>
                                        <Typography variant="body2">{customer.fatherName || "—"}</Typography>
                                    </TableCell>

                                    {/* Measurement No */}
                                    <TableCell>
                                        {customer.measurementNo ? (
                                            <Chip
                                                label={customer.measurementNo}
                                                size="small"
                                                icon={<Ruler size={12} />}
                                                sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 600, fontSize: '0.75rem' }}
                                            />
                                        ) : (
                                            <Typography variant="body2" color="text.disabled">—</Typography>
                                        )}
                                    </TableCell>

                                    {/* Balance */}
                                    <TableCell>
                                        <Tooltip title="View Ledger">
                                            <Box
                                                onClick={() => handleOpenLedger(customer)}
                                                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, width: "fit-content" }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{
                                                        color:
                                                            customer.balance > 0
                                                                ? "success.main"
                                                                : customer.balance < 0
                                                                    ? "error.main"
                                                                    : "text.primary",
                                                    }}
                                                >
                                                    Rs. {Math.abs(parseFloat(customer.balance || 0)).toFixed(2)}
                                                    {parseFloat(customer.balance || 0) > 0
                                                        ? " (Cr)"
                                                        : parseFloat(customer.balance || 0) < 0
                                                            ? " (Dr)"
                                                            : ""}
                                                </Typography>
                                                <BookText size={14} color="#9ca3af" />
                                            </Box>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Phone */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Phone size={14} color="#9ca3af" />
                                            <Typography variant="body2">{customer.phone || "—"}</Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Address */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <MapPin size={14} color="#9ca3af" />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: "vertical",
                                                    maxWidth: 220,
                                                }}
                                            >
                                                {customer.address || "—"}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <Tooltip title="Measurements">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    component={Link}
                                                    href={`/dashboard/measurements?customerId=${customer.id}`}
                                                >
                                                    <Ruler size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(customer)}>
                                                    <Edit size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(customer)}>
                                                    <Trash2 size={17} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Users size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                                        No customers found.
                                    </Typography>
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

            {/* ── Add / Edit Customer Dialog ────────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {formData.id ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Top action row — Add Category button sits here, top-right */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Plus size={15} />}
                            onClick={() => setQuickAddCatOpen(true)}
                            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
                        >
                            Add Category
                        </Button>
                    </Box>

                    {/* Image Upload */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ position: "relative" }}>
                            <Avatar
                                src={imagePreview || undefined}
                                sx={{ width: 72, height: 72, fontSize: "1.6rem", fontWeight: 700, bgcolor: "primary.main", cursor: "pointer", border: "2px dashed", borderColor: imagePreview ? "transparent" : "primary.main" }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {!imagePreview && <Camera size={28} />}
                            </Avatar>
                            {imagePreview && (
                                <IconButton
                                    size="small"
                                    onClick={handleRemoveImage}
                                    sx={{ position: "absolute", top: -6, right: -6, bgcolor: "error.main", color: "white", width: 20, height: 20, "&:hover": { bgcolor: "error.dark" } }}
                                >
                                    <X size={12} />
                                </IconButton>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>Customer Photo</Typography>
                            <Typography variant="caption" color="text.secondary">JPEG, PNG, WebP up to 5MB</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.75rem" }}>
                                    {imagePreview ? "Change Photo" : "Upload Photo"}
                                </Button>
                            </Box>
                        </Box>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                    </Box>

                    <Grid container spacing={2}>
                        {/* Full Name */}
                        <Grid size={{ xs: 12, md: 4 }}>
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

                        {/* Father Name */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Father Name"
                                name="fatherName"
                                placeholder="Enter father's name"
                                value={formData.fatherName || ""}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        {/* Measurement No */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Measurement No"
                                name="measurementNo"
                                placeholder="e.g. M-001"
                                value={formData.measurementNo || ""}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        {/* Phone */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phone Number"
                                name="phone"
                                placeholder="03001234567"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Typography sx={{ fontSize: "0.95rem", lineHeight: 1 }}>🇵🇰</Typography>
                                                <Typography variant="body2" fontWeight={600}>+92</Typography>
                                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16 }} />
                                            </Box>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* Opening Balance */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Opening Balance"
                                name="balance"
                                type="number"
                                required
                                placeholder="0.00"
                                value={formData.balance}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Typography variant="body2" fontWeight={600}>Rs.</Typography>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* Account Category */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={categories}
                                getOptionLabel={(option) => option.name || ""}
                                value={categories.find((c) => c.id === formData.accountCategoryId) || null}
                                onChange={(event, newValue) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountCategoryId: newValue ? newValue.id : null,
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Account Category"
                                        variant="outlined"
                                        placeholder="Select category"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Address */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Address"
                                name="address"
                                placeholder="Enter full address"
                                multiline
                                rows={3}
                                value={formData.address}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        {/* Notes — full width on last row */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Notes"
                                name="notes"
                                placeholder="Additional information..."
                                multiline
                                rows={2}
                                value={formData.notes}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading} sx={{ borderRadius: 2, textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !formData.name?.trim()}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : formData.id ? "Update Customer" : "Save Customer"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Quick Add Category Dialog ─────────────────── */}
            <Dialog
                open={quickAddCatOpen}
                onClose={() => setQuickAddCatOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider" }}>
                    New Account Category
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth
                        label="Category Name"
                        placeholder="e.g. Wholesaler, VIP"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        autoFocus
                        variant="outlined"
                        onKeyDown={(e) => { if (e.key === "Enter") handleQuickAddCategory(); }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setQuickAddCatOpen(false)}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleQuickAddCategory}
                        disabled={!newCatName.trim() || newCatLoading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        {newCatLoading ? <CircularProgress size={20} color="inherit" /> : "Create Category"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Secure Delete Customer Dialog ─────────────────── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", color: "error.main" }}>
                    Permanently Delete Profile
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        This action is permanent and cannot be undone. All related measurements, bookings, bills, orders, and ledger records will be deleted.
                    </Alert>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please type the customer's name <strong>{customerToDelete?.name}</strong> to confirm.
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type customer name to confirm"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        disabled={deleteLoading}
                        variant="outlined"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && confirmName.trim() === customerToDelete?.name?.trim() && !deleteLoading) {
                                handlePermanentDelete();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        color="inherit"
                        disabled={deleteLoading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handlePermanentDelete}
                        disabled={confirmName.trim() !== customerToDelete?.name?.trim() || deleteLoading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        {deleteLoading ? <CircularProgress size={20} color="inherit" /> : "Permanently Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Ledger Dialog ─────────────────────────────── */}
            <Dialog
                open={ledgerOpen}
                onClose={() => setLedgerOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>{ledgerCustomer?.name} — Ledger</Typography>
                            <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                                {ledgerCustomer?.phone && (
                                    <Typography variant="caption" color="text.secondary">{ledgerCustomer.phone}</Typography>
                                )}
                                <Typography variant="caption" fontWeight={700}
                                    sx={{ color: parseFloat(ledgerCustomer?.balance || 0) >= 0 ? "success.main" : "error.main" }}>
                                    Balance: Rs. {Math.abs(parseFloat(ledgerCustomer?.balance || 0)).toFixed(2)}
                                    {parseFloat(ledgerCustomer?.balance || 0) > 0 ? " (Cr)" : parseFloat(ledgerCustomer?.balance || 0) < 0 ? " (Dr)" : ""}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton size="small" onClick={() => setLedgerOpen(false)}><X size={18} /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* Date Filters Bar */}
                    <Box sx={{ display: "flex", gap: 2, p: 2, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap", alignItems: "center" }}>
                        <TextField
                            size="small"
                            type="date"
                            label="From Date"
                            value={ledgerDateFrom}
                            onChange={(e) => setLedgerDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="To Date"
                            value={ledgerDateTo}
                            onChange={(e) => setLedgerDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                            inputProps={{ min: ledgerDateFrom || undefined }}
                        />
                        {(ledgerDateFrom || ledgerDateTo) && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => {
                                    setLedgerDateFrom("");
                                    setLedgerDateTo("");
                                }}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                                Clear Dates
                            </Button>
                        )}
                        {!ledgerLoading && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                                Showing {sortedFilteredEntries.length} of {ledgerEntries.length} entries
                            </Typography>
                        )}
                    </Box>

                    {ledgerLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : sortedFilteredEntries.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 6 }}>
                            <BookText size={36} color="#d1d5db" />
                            <Typography color="text.secondary" sx={{ mt: 1 }}>No ledger entries found in this period.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "action.hover" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Debit</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Credit</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Optional Opening Balance Row */}
                                    {ledgerDateFrom && (
                                        <TableRow sx={{ bgcolor: "action.selected", fontStyle: "italic" }}>
                                            <TableCell sx={{ color: "#6b7280" }}></TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                {new Date(ledgerDateFrom).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Opening Balance (Brought Forward)</TableCell>
                                            <TableCell sx={{ textAlign: "right" }}></TableCell>
                                            <TableCell sx={{ textAlign: "right" }}></TableCell>
                                            <TableCell sx={{ textAlign: "right" }}>
                                                <Typography variant="body2" fontWeight={700}
                                                    sx={{ color: openingBalance >= 0 ? "success.main" : "error.main" }}>
                                                    Rs. {Math.abs(openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    {openingBalance > 0 ? " Cr" : openingBalance < 0 ? " Dr" : ""}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {(() => {
                                        let running = openingBalance;
                                        return sortedFilteredEntries.map((entry, idx) => {
                                            const amt = parseFloat(entry.amount || 0);
                                            if (entry.type === "DEBIT") running += amt;
                                            else running -= amt;
                                            return (
                                                <TableRow key={entry.id} hover>
                                                    <TableCell sx={{ color: "#6b7280" }}>{idx + 1}</TableCell>
                                                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                        {new Date(entry.entryDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{entry.description || "—"}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right" }}>
                                                        {entry.type === "DEBIT" ? (
                                                            <Typography variant="body2" fontWeight={600} color="error.main">
                                                                Rs. {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </Typography>
                                                        ) : "—"}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right" }}>
                                                        {entry.type === "CREDIT" ? (
                                                            <Typography variant="body2" fontWeight={600} color="success.main">
                                                                Rs. {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </Typography>
                                                        ) : "—"}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right" }}>
                                                        <Typography variant="body2" fontWeight={700}
                                                            sx={{ color: running >= 0 ? "success.main" : "error.main" }}>
                                                            Rs. {Math.abs(running).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            {running > 0 ? " Cr" : running < 0 ? " Dr" : ""}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        });
                                    })()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={() => setLedgerOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: "none" }}>
                        Close
                    </Button>
                    <Button
                        onClick={handlePrintLedger}
                        variant="contained"
                        disabled={ledgerLoading || sortedFilteredEntries.length === 0}
                        sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#1e293b", "&:hover": { bgcolor: "#0f172a" } }}
                    >
                        Print Ledger
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ──────────────────────────── */}
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
