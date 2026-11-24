"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    CircularProgress,
    Tooltip,
    useTheme,
    Chip,
    Card,
    MenuItem
} from "@mui/material";
import {
    Search,
    RotateCcw,
    Printer,
    TrendingUp,
    Percent,
    FileText
} from "lucide-react";
import { useSession } from "next-auth/react";
import { checkPermission } from "@/lib/permissions";

function generateTransactionRosterReportHtml({
    transactions,
    summary,
    branch,
    dateFrom,
    dateTo,
    datePreset,
    source,
    generatedBy
}) {
    const brandName = branch?.name || "Grace Cloth and Tailors";
    const brandLogo = branch?.logo || "/logo.png";
    const brandPhone = branch?.phone || "";
    const brandAddress = branch?.address || "";
    const brandSlogan = branch?.slogan || "";

    const periodText = (dateFrom && dateTo)
        ? (dateFrom === dateTo ? `Date: ${dateFrom}` : `Period: ${dateFrom} to ${dateTo}`)
        : (dateFrom ? `From: ${dateFrom}` : (dateTo ? `Up to: ${dateTo}` : "All Recorded Transactions"));

    const now = new Date();
    const printTimeStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        " at " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const totalNetAmt = summary?.total?.amount ?? 0;
    const prodAmt = summary?.product?.amount ?? 0;
    const stitchAmt = summary?.stitching?.amount ?? 0;
    const ledgerAmt = summary?.ledger?.amount ?? 0;
    const cashAmt = summary?.cash?.amount ?? 0;
    const bankAmt = summary?.bank?.amount ?? 0;
    const returnsAmt = summary?.returns?.amount ?? 0;

    const rowsHtml = transactions.map((t, idx) => {
        const isRet = Boolean(t.isReturn || t.amount < 0);
        const numAmt = parseFloat(t.amount || 0);

        const formattedAmt = isRet
            ? `<span style="color:#b91c1c;font-weight:700;">-Rs. ${Math.abs(numAmt).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
            : `<span style="font-weight:700;">Rs. ${numAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;

        const typeBadge = isRet
            ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px;">Return (Refund)</span>`
            : `<span style="background:#f1f5f9;color:#334155;padding:2px 6px;border-radius:4px;font-weight:600;font-size:10px;">${t.receivingType || t.source || 'Receiving'}</span>`;

        const modeBadge = t.paymentMethod?.toLowerCase().includes("bank")
            ? `<span style="color:#6d28d9;font-weight:600;">Bank</span>`
            : `<span style="color:#047857;font-weight:600;">Cash</span>`;

        return `
            <tr style="border-bottom:1px solid #e2e8f0;${isRet ? 'background:#fff8f8;' : (idx % 2 === 1 ? 'background:#f8fafc;' : '')}">
                <td style="padding:6px 8px;text-align:center;font-size:10px;color:#64748b;">${idx + 1}</td>
                <td style="padding:6px 8px;font-family:monospace;font-weight:700;font-size:11px;color:${isRet ? '#b91c1c' : '#1d4ed8'};">#${t.receiptNo}</td>
                <td style="padding:6px 8px;font-size:10.5px;white-space:nowrap;">
                    <div>${t.formattedDate}</div>
                    <div style="font-size:9.5px;color:#64748b;">${t.formattedTime || ''}</div>
                </td>
                <td style="padding:6px 8px;font-size:11px;">
                    <div style="font-weight:700;color:#0f172a;">${t.accountName || 'Customer'}</div>
                    <div style="font-size:9.5px;color:#64748b;">${t.accountOver || ''} ${t.address ? '• ' + t.address : ''}</div>
                </td>
                <td style="padding:6px 8px;font-size:10.5px;">${typeBadge}</td>
                <td style="padding:6px 8px;font-size:10.5px;font-family:monospace;color:#475569;">${t.sourceRef || '—'}</td>
                <td style="padding:6px 8px;font-size:10.5px;text-align:center;">${modeBadge}</td>
                <td style="padding:6px 8px;font-size:10px;color:#475569;max-width:240px;line-height:1.3;">${t.description || '—'}</td>
                <td style="padding:6px 8px;text-align:right;font-size:11.5px;white-space:nowrap;">${formattedAmt}</td>
            </tr>
        `;
    }).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Transaction Roster Report - ${brandName}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 11px; line-height: 1.4; padding: 16px; }
    
    .toolbar { position: sticky; top: 0; background: #1e293b; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .toolbar h3 { font-size: 13px; font-weight: 600; }
    .toolbar button { background: #2563eb; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; margin-left: 8px; }
    .toolbar button.close-btn { background: #475569; }
    .toolbar button:hover { opacity: 0.9; }

    .header-box { border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; gap: 16px; }
    .header-logo { width: 68px; height: 68px; object-fit: contain; }
    .header-content { flex: 1; text-align: center; }
    .header-content h1 { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a; }
    .header-content .tagline { font-size: 11px; font-style: italic; color: #475569; margin-top: 2px; }
    .header-content .contact { font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 4px; }
    .header-content .address { font-size: 10.5px; color: #64748b; margin-top: 2px; }

    .report-title-banner { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
    .report-title-banner .title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
    .report-title-banner .meta { font-size: 10.5px; color: #475569; font-weight: 600; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .summary-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #fafafa; }
    .summary-card.highlight { background: #f0fdf4; border-color: #86efac; }
    .summary-card.return-card { background: #fef2f2; border-color: #fca5a5; }
    .summary-card .lbl { font-size: 9.5px; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .summary-card .val { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .summary-card.highlight .val { color: #15803d; }
    .summary-card.return-card .val { color: #b91c1c; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead { display: table-header-group; }
    thead tr { background: #0f172a; color: #fff; }
    th { padding: 7px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid #334155; }
    td { border: 1px solid #e2e8f0; vertical-align: middle; }
    tfoot tr { background: #0f172a; color: #fff; font-weight: 800; }
    tfoot td { border: 1px solid #334155; padding: 8px; font-size: 11px; }

    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 36px; padding-top: 12px; page-break-inside: avoid; }
    .sig-line { border-top: 1.5px solid #64748b; padding-top: 6px; text-align: center; font-size: 11px; font-weight: 700; color: #334155; }

    @media print {
        .toolbar { display: none !important; }
        body { padding: 0 !important; font-size: 10px !important; }
        .summary-card .val { font-size: 12px !important; }
        table { font-size: 9.5px !important; }
        @page { size: A4 landscape; margin: 8mm; }
    }
</style>
</head>
<body>
    <div class="toolbar">
        <div>
            <h3>Transaction Roster Report • Ready to Print</h3>
            <span style="font-size:11px;opacity:0.85;">${transactions.length} record(s) loaded</span>
        </div>
        <div>
            <button class="close-btn" onclick="window.close()">Close</button>
            <button onclick="window.print()">🖨️ Print Report</button>
        </div>
    </div>

    <div class="header-box">
        <img class="header-logo" src="${brandLogo}" alt="Logo" onerror="this.src='/logo.png'"/>
        <div class="header-content">
            <h1>${brandName}</h1>
            ${brandSlogan ? `<div class="tagline">“${brandSlogan}”</div>` : ''}
            <div class="contact">
                ${brandPhone ? `<span>📞 ${brandPhone}</span>` : ''}
                ${branch?.code ? `<span style="margin-left:12px;background:#e2e8f0;padding:1px 6px;border-radius:4px;">Branch Code: ${branch.code}</span>` : ''}
            </div>
            ${brandAddress ? `<div class="address">${brandAddress}</div>` : ''}
        </div>
    </div>

    <div class="report-title-banner">
        <div>
            <div class="title">Transaction Roster & Cash Receiving Report</div>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">Category Filter: <strong>${source}</strong></div>
        </div>
        <div class="meta" style="text-align:right;">
            <div>${periodText}</div>
            <div style="font-size:9.5px;color:#64748b;margin-top:2px;">Generated on: ${printTimeStr} ${generatedBy ? `• By: ${generatedBy}` : ''}</div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card highlight">
            <div class="lbl">Total Net Receiving</div>
            <div class="val">Rs. ${totalNetAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Product Receiving</div>
            <div class="val">Rs. ${prodAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Stitching Receiving</div>
            <div class="val">Rs. ${stitchAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Ledger Receiving</div>
            <div class="val">Rs. ${ledgerAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Cash Received</div>
            <div class="val">Rs. ${cashAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Bank Received</div>
            <div class="val">Rs. ${bankAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card return-card">
            <div class="lbl">Sale Returns (Deducted)</div>
            <div class="val">-Rs. ${returnsAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <div class="lbl">Total Transactions</div>
            <div class="val">${transactions.length} record(s)</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:30px;">#</th>
                <th style="width:110px;text-align:left;">Receipt / Ref #</th>
                <th style="width:95px;text-align:left;">Date & Time</th>
                <th style="width:150px;text-align:left;">Customer Account</th>
                <th style="width:110px;text-align:left;">Transaction Type</th>
                <th style="width:105px;text-align:left;">Source Ref</th>
                <th style="width:65px;text-align:center;">Mode</th>
                <th style="text-align:left;">Description / Details</th>
                <th style="width:115px;text-align:right;">Amount (PKR)</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align:center;padding:24px;color:#94a3b8;">No transactions found for the selected period.</td></tr>`}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7" style="text-align:right;letter-spacing:0.5px;">TOTAL TRANSACTIONS: ${transactions.length} | NET RECEIVING SUM:</td>
                <td colspan="2" style="text-align:right;font-size:12px;letter-spacing:0.5px;">Rs. ${totalNetAmt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        </tfoot>
    </table>

    <div class="signatures">
        <div class="sig-line">Prepared By (Staff / Data Entry)</div>
        <div class="sig-line">Cashier / Counter In-charge</div>
        <div class="sig-line">Audited & Verified (Manager / Admin)</div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 400);
        };
    </script>
</body>
</html>`;
}

export default function ReceivingTransactionsClient({ initialData, branches = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const { data: session, status: authStatus } = useSession();

    // Helper formatters ensuring no undefined/null/NaN errors
    const formatCurrency = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return "Rs. 0.00";
        return `Rs. ${num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatCount = (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) return "0";
        return num.toLocaleString();
    };

    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const initialToday = initialData?.dateFrom || getTodayString();

    // Filter states
    const [source, setSource] = useState("ALL"); // ALL | PRODUCT | STITCHING | LEDGER
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("ALL");

    // Date range filter states - defaults to current date (TODAY)
    const [datePreset, setDatePreset] = useState(initialData?.datePreset || "TODAY");
    const [dateFrom, setDateFrom] = useState(initialData?.dateFrom || initialToday);
    const [dateTo, setDateTo] = useState(initialData?.dateTo || initialToday);

    // Sorting states
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");

    // Pagination states
    const [page, setPage] = useState(1);
    const limit = 12;

    // Data states
    const [transactions, setTransactions] = useState(initialData?.transactions || []);
    const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
    const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
    const [summary, setSummary] = useState(() => ({
        total: { amount: initialData?.summary?.total?.amount ?? 0, count: initialData?.summary?.total?.count ?? 0 },
        product: { amount: initialData?.summary?.product?.amount ?? 0, count: initialData?.summary?.product?.count ?? 0 },
        stitching: { amount: initialData?.summary?.stitching?.amount ?? 0, count: initialData?.summary?.stitching?.count ?? 0 },
        ledger: { amount: initialData?.summary?.ledger?.amount ?? 0, count: initialData?.summary?.ledger?.count ?? 0 },
        cash: { amount: initialData?.summary?.cash?.amount ?? 0, count: 0 },
        bank: { amount: initialData?.summary?.bank?.amount ?? 0, count: 0 },
        returns: { amount: initialData?.summary?.returns?.amount ?? 0, count: initialData?.summary?.returns?.count ?? 0 }
    }));
    const [loading, setLoading] = useState(false);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch transactions
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                source,
                sortBy,
                sortOrder
            });

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }
            if (dateFrom) {
                params.append("dateFrom", dateFrom);
            }
            if (dateTo) {
                params.append("dateTo", dateTo);
            }
            if (selectedBranchId && selectedBranchId !== "ALL") {
                params.append("branchId", selectedBranchId);
            }

            const res = await fetch(`/api/receiving-transactions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
                setTotalCount(data.totalCount || 0);
                setTotalPages(data.totalPages || 1);
                if (data.summary) {
                    setSummary({
                        total: { amount: data.summary.total?.amount ?? 0, count: data.summary.total?.count ?? 0 },
                        product: { amount: data.summary.product?.amount ?? 0, count: data.summary.product?.count ?? 0 },
                        stitching: { amount: data.summary.stitching?.amount ?? 0, count: data.summary.stitching?.count ?? 0 },
                        ledger: { amount: data.summary.ledger?.amount ?? 0, count: data.summary.ledger?.count ?? 0 },
                        cash: { amount: data.summary.cash?.amount ?? 0, count: 0 },
                        bank: { amount: data.summary.bank?.amount ?? 0, count: 0 },
                        returns: { amount: data.summary.returns?.amount ?? 0, count: data.summary.returns?.count ?? 0 }
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load receiving transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when dependencies change
    useEffect(() => {
        fetchTransactions();
    }, [page, source, debouncedSearch, dateFrom, dateTo, sortBy, sortOrder, selectedBranchId]);

    const formatYMD = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const applyDatePreset = (preset) => {
        setDatePreset(preset);
        const now = new Date();
        if (preset === "ALL") {
            setDateFrom("");
            setDateTo("");
        } else if (preset === "TODAY") {
            const todayStr = formatYMD(now);
            setDateFrom(todayStr);
            setDateTo(todayStr);
        } else if (preset === "YESTERDAY") {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = formatYMD(y);
            setDateFrom(yStr);
            setDateTo(yStr);
        } else if (preset === "THIS_MONTH") {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setDateFrom(formatYMD(firstDay));
            setDateTo(formatYMD(lastDay));
        }
        setPage(1);
    };

    const startRange = totalCount === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, totalCount);

    const getPageNumbers = () => {
        const pages = [];
        const maxButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleCardClick = (cardSource) => {
        if (source === cardSource && cardSource !== "ALL") {
            setSource("ALL");
        } else {
            setSource(cardSource);
        }
        setPage(1);
    };

    const [printingReport, setPrintingReport] = useState(false);

    const handlePrintReport = async () => {
        setPrintingReport(true);
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "5000",
                source,
                sortBy,
                sortOrder
            });

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }
            if (dateFrom) {
                params.append("dateFrom", dateFrom);
            }
            if (dateTo) {
                params.append("dateTo", dateTo);
            }
            if (selectedBranchId && selectedBranchId !== "ALL") {
                params.append("branchId", selectedBranchId);
            }

            const res = await fetch(`/api/receiving-transactions?${params.toString()}`);
            let reportTransactions = transactions;
            let reportSummary = summary;
            if (res.ok) {
                const data = await res.json();
                reportTransactions = data.transactions || transactions;
                reportSummary = data.summary || summary;
            }

            const activeBranch = (selectedBranchId && selectedBranchId !== "ALL")
                ? branches.find(b => String(b.id) === String(selectedBranchId))
                : (session?.user?.branchId ? branches.find(b => String(b.id) === String(session.user.branchId)) : null)
                  || branches[0];

            const html = generateTransactionRosterReportHtml({
                transactions: reportTransactions,
                summary: reportSummary,
                branch: activeBranch,
                dateFrom,
                dateTo,
                datePreset,
                source,
                generatedBy: session?.user?.name || session?.user?.email || "Cashier"
            });

            const win = window.open("", "_blank");
            if (win) {
                win.document.write(html);
                win.document.close();
            } else {
                alert("Please allow popups to open the printable report.");
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
            alert("Error generating report. Please try again.");
        } finally {
            setPrintingReport(false);
        }
    };

    if (authStatus === "loading") {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    const isAdmin = String(session?.user?.role || "").trim().toUpperCase() === "ADMIN" || Boolean(session?.user?.isAdmin);
    const canView = isAdmin || checkPermission(session, "receiving-transactions", "view") || checkPermission(session, "ledger", "view");

    if (!canView && !isAdmin && authStatus === "authenticated") {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="error">
                    You do not have permission to view receiving transactions.
                </Typography>
            </Box>
        );
    }

    const getSubtitle = () => {
        if (datePreset === "TODAY") return "Today's Transactions";
        if (datePreset === "YESTERDAY") return "Yesterday's Transactions";
        if (datePreset === "THIS_MONTH") return "This Month's Transactions";
        if (dateFrom && dateTo) {
            return `Transactions from ${dateFrom} to ${dateTo}`;
        }
        if (dateFrom) return `Transactions from ${dateFrom}`;
        if (dateTo) return `Transactions up to ${dateTo}`;
        return "All Recent Transactions";
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", py: 2.5, px: { xs: 1.5, sm: 3 } }}>
            {/* Top Header: Title, Subtitle, and Top Pagination */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "text.primary",
                            fontSize: { xs: "1.35rem", sm: "1.65rem" }
                        }}
                    >
                        Transaction Roster
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            mt: 0.25,
                            fontSize: "0.88rem",
                            fontWeight: 500
                        }}
                    >
                        {getSubtitle()}
                    </Typography>
                </Box>

                {/* Top Pagination */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                        size="small"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        sx={{
                            textTransform: "none",
                            color: page <= 1 ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Prev
                    </Button>

                    {getPageNumbers().map(pageNum => (
                        <Button
                            key={pageNum}
                            size="small"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                            sx={{
                                minWidth: 28,
                                height: 28,
                                p: 0,
                                borderRadius: 1,
                                fontSize: "0.85rem",
                                fontWeight: pageNum === page ? 700 : 500,
                                color: pageNum === page ? "#ffffff" : "text.secondary",
                                bgcolor: pageNum === page ? "#2563eb" : "transparent",
                                "&:hover": {
                                    bgcolor: pageNum === page ? "#1d4ed8" : "action.hover",
                                    color: pageNum === page ? "#ffffff" : "text.primary"
                                }
                            }}
                        >
                            {pageNum}
                        </Button>
                    ))}

                    <Button
                        size="small"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        sx={{
                            textTransform: "none",
                            color: page >= totalPages ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            {/* Date Range Selection Bar: Direct 2 Date Pickers + Quick Presets + Search */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 2.5,
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1.5
                }}
            >
                {/* 1. Date Range: Two Date Pickers */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.76rem" }}>
                            From:
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setDatePreset("CUSTOM");
                                setPage(1);
                            }}
                            sx={{
                                width: 145,
                                "& .MuiInputBase-root": { height: 34, fontSize: "0.82rem", borderRadius: 1.5 }
                            }}
                        />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.76rem" }}>
                            To:
                        </Typography>
                        <TextField
                            size="small"
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setDatePreset("CUSTOM");
                                setPage(1);
                            }}
                            sx={{
                                width: 145,
                                "& .MuiInputBase-root": { height: 34, fontSize: "0.82rem", borderRadius: 1.5 }
                            }}
                        />
                    </Box>
                </Box>

                {/* 2. Quick Range Presets */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                    {[
                        { label: "Today", value: "TODAY" },
                        { label: "Yesterday", value: "YESTERDAY" },
                        { label: "This Month", value: "THIS_MONTH" },
                        { label: "All Time", value: "ALL" }
                    ].map((p) => {
                        const isPresetActive = datePreset === p.value;
                        return (
                            <Chip
                                key={p.value}
                                label={p.label}
                                size="small"
                                clickable
                                onClick={() => applyDatePreset(p.value)}
                                color={isPresetActive ? "primary" : "default"}
                                variant={isPresetActive ? "filled" : "outlined"}
                                sx={{
                                    height: 30,
                                    fontSize: "0.76rem",
                                    fontWeight: isPresetActive ? 700 : 500,
                                    borderRadius: 1.5,
                                    ...(isPresetActive
                                        ? { bgcolor: "#2563eb", color: "#fff" }
                                        : { bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc" })
                                }}
                            />
                        );
                    })}
                </Box>

                {/* 3. Search and Actions */}
                <Box sx={{ ml: { xs: 0, lg: "auto" }, display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" }, flexWrap: "wrap" }}>
                    {branches.length > 0 && (
                        <TextField
                            select
                            size="small"
                            value={selectedBranchId}
                            onChange={(e) => {
                                setSelectedBranchId(e.target.value);
                                setPage(1);
                            }}
                            sx={{
                                minWidth: 155,
                                "& .MuiInputBase-root": { height: 34, fontSize: "0.82rem", borderRadius: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fff" }
                            }}
                        >
                            <MenuItem value="ALL" sx={{ fontSize: "0.82rem", fontWeight: 600 }}>All Branches</MenuItem>
                            {branches.map(b => (
                                <MenuItem key={b.id} value={String(b.id)} sx={{ fontSize: "0.82rem" }}>
                                    {b.name} {b.code ? `(${b.code})` : ""}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                    <TextField
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search receipt, customer..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={14} style={{ opacity: 0.55 }} />
                                </InputAdornment>
                            ),
                            sx: { height: 34, fontSize: "0.82rem", width: { xs: "100%", sm: 200 }, borderRadius: 1.5 }
                        }}
                    />
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={fetchTransactions} disabled={loading}>
                            <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={printingReport ? <CircularProgress size={14} color="inherit" /> : <Printer size={15} />}
                        onClick={handlePrintReport}
                        disabled={loading || printingReport}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            height: 34,
                            px: 1.5,
                            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1",
                            color: isDark ? "#e2e8f0" : "#334155",
                            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                            "&:hover": {
                                borderColor: "#2563eb",
                                bgcolor: isDark ? "rgba(37,99,235,0.12)" : "#eff6ff",
                                color: "#2563eb"
                            }
                        }}
                    >
                        {printingReport ? "Generating..." : "Print Report"}
                    </Button>
                </Box>
            </Paper>

            {/* Transaction Roster Container matching exact reference screenshot (Full Width) */}
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    overflow: "hidden",
                    mb: 2.5
                }}
            >
                {loading && transactions.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, fontWeight: 500 }}>
                            Loading transaction roster...
                        </Typography>
                    </Box>
                ) : transactions.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            No transactions found for the selected date
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
                            Try selecting another date range or click "All Time" to view all records.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <Box sx={{ minWidth: 960, width: "100%" }}>
                            {transactions.map((tx, idx) => {
                                const isFirst = idx === 0;
                                const amtNum = parseFloat(tx.amount || 0);
                                return (
                                    <Box
                                        key={tx.id || idx}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "170px 115px 165px 145px 135px 1fr 95px 145px",
                                            alignItems: "center",
                                            py: 2,
                                            px: 2.5,
                                            borderBottom: idx === transactions.length - 1 ? "none" : "1px solid",
                                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                            transition: "background-color 0.15s ease",
                                            "&:hover": {
                                                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"
                                            }
                                        }}
                                    >
                                        {/* Col 1: Receipt Badge #REC-202609-0544-7145 */}
                                        <Box>
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    px: 1.25,
                                                    py: 0.4,
                                                    borderRadius: 1.5,
                                                    bgcolor: tx.isReturn
                                                        ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2")
                                                        : (isDark ? "rgba(37, 99, 235, 0.15)" : "#eff6ff"),
                                                    border: "1px solid",
                                                    borderColor: tx.isReturn
                                                        ? (isDark ? "rgba(239, 68, 68, 0.35)" : "#fca5a5")
                                                        : (isDark ? "rgba(37, 99, 235, 0.35)" : "#bfdbfe"),
                                                    color: tx.isReturn ? "#dc2626" : "#2563eb",
                                                    fontWeight: 700,
                                                    fontSize: "0.76rem",
                                                    letterSpacing: "0.01em",
                                                    whiteSpace: "nowrap"
                                                }}
                                            >
                                                #{tx.receiptNo}
                                            </Box>
                                            {tx.branch && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Chip
                                                        label={tx.branch.name}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: "0.64rem",
                                                            fontWeight: 700,
                                                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                                            color: isDark ? "#93c5fd" : "#475569"
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Col 2: Date & Time */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.84rem",
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.formattedDate}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.formattedTime || "--"}
                                            </Typography>
                                        </Box>

                                        {/* Col 3: Source (From Booking / Booking #...) */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    color: tx.isReturn ? "#dc2626" : "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.receivingType || "From Booking"}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.74rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.sourceRef || "Customer Ledger"}
                                            </Typography>
                                        </Box>

                                        {/* Col 4: Customer Name & Phone / Code */}
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.88rem",
                                                    color: "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.accountName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    color: "text.secondary",
                                                    mt: 0.25,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {tx.accountOver}
                                            </Typography>
                                        </Box>

                                        {/* Col 5: Pink/Magenta Dot + Address */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden" }}>
                                            <Box
                                                sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    bgcolor: "#ec4899",
                                                    flexShrink: 0
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontSize: "0.82rem",
                                                    color: "text.secondary",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}
                                                title={tx.address || ""}
                                            >
                                                {tx.address || "—"}
                                            </Typography>
                                        </Box>

                                        {/* Col 6: Description */}
                                        <Box sx={{ pr: 1.5 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.84rem",
                                                    color: "text.secondary",
                                                    lineHeight: 1.35,
                                                    wordBreak: "break-word"
                                                }}
                                            >
                                                {tx.description}
                                            </Typography>
                                        </Box>

                                        {/* Col 7: Payment Mode Badge (Cash / Bank) */}
                                        <Box>
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    px: 1.5,
                                                    py: 0.25,
                                                    borderRadius: 1.5,
                                                    border: "1px solid",
                                                    borderColor: tx.isReturn
                                                        ? (isDark ? "rgba(239, 68, 68, 0.4)" : "#fca5a5")
                                                        : (tx.paymentMethod?.toLowerCase().includes("transfer") ? "#2563eb" : (tx.paymentMethod?.toLowerCase().includes("bank") ? "#8b5cf6" : "#10b981")),
                                                    color: tx.isReturn
                                                        ? "#dc2626"
                                                        : (tx.paymentMethod?.toLowerCase().includes("transfer") ? "#1d4ed8" : (tx.paymentMethod?.toLowerCase().includes("bank") ? "#7c3aed" : "#059669")),
                                                    bgcolor: tx.isReturn
                                                        ? (isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2")
                                                        : (tx.paymentMethod?.toLowerCase().includes("transfer")
                                                            ? (isDark ? "rgba(37, 99, 235, 0.12)" : "#eff6ff")
                                                            : (tx.paymentMethod?.toLowerCase().includes("bank")
                                                                ? (isDark ? "rgba(139, 92, 246, 0.12)" : "#f5f3ff")
                                                                : (isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5"))),
                                                    fontWeight: 600,
                                                    fontSize: "0.76rem"
                                                }}
                                            >
                                                {tx.isReturn
                                                    ? `Refund (${tx.paymentMethod || "Cash"})`
                                                    : (tx.paymentMethod?.toLowerCase().includes("transfer") ? "Transfer" : (tx.paymentMethod?.toLowerCase().includes("bank") ? "Bank" : "Cash"))}
                                            </Box>
                                        </Box>

                                        {/* Col 8: Receiving Amount */}
                                        <Box sx={{ textAlign: "right", pl: 1 }}>
                                            {isFirst && (
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.76rem",
                                                        fontWeight: 600,
                                                        color: "text.secondary",
                                                        mb: 0.4,
                                                        lineHeight: 1.1
                                                    }}
                                                >
                                                    Receiving Amount
                                                </Typography>
                                            )}
                                            <Typography
                                                sx={{
                                                    fontSize: "0.96rem",
                                                    fontWeight: 700,
                                                    color: tx.isReturn || amtNum < 0 ? "#dc2626" : "text.primary",
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {isNaN(amtNum) || amtNum === 0 
                                                    ? "0" 
                                                    : (amtNum < 0 ? `-Rs. ${Math.abs(amtNum).toLocaleString()}` : amtNum.toLocaleString())}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Bottom Bar: Showing range and Bottom Pagination */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 3,
                    px: 0.5
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        fontSize: "0.85rem",
                        fontWeight: 500
                    }}
                >
                    Showing {startRange}-{endRange} of {totalCount}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                        size="small"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        sx={{
                            textTransform: "none",
                            color: page <= 1 ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Prev
                    </Button>

                    {getPageNumbers().map(pageNum => (
                        <Button
                            key={pageNum}
                            size="small"
                            onClick={() => setPage(pageNum)}
                            disabled={loading}
                            sx={{
                                minWidth: 28,
                                height: 28,
                                p: 0,
                                borderRadius: 1,
                                fontSize: "0.85rem",
                                fontWeight: pageNum === page ? 700 : 500,
                                color: pageNum === page ? "#ffffff" : "text.secondary",
                                bgcolor: pageNum === page ? "#2563eb" : "transparent",
                                "&:hover": {
                                    bgcolor: pageNum === page ? "#1d4ed8" : "action.hover",
                                    color: pageNum === page ? "#ffffff" : "text.primary"
                                }
                            }}
                        >
                            {pageNum}
                        </Button>
                    ))}

                    <Button
                        size="small"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        sx={{
                            textTransform: "none",
                            color: page >= totalPages ? "text.disabled" : "text.secondary",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            minWidth: "auto",
                            px: 1,
                            py: 0.25,
                            "&:hover": { bgcolor: "action.hover", color: "text.primary" }
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>

            {/* 4 Summary Cards at Bottom (Expanded Full Width CSS Grid) */}
            <Box
                sx={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                    gap: 2.5
                }}
            >
                {/* 1. Total Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("ALL")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
                        border: "1px solid",
                        borderColor: source === "ALL" ? "#10b981" : isDark ? "rgba(16, 185, 129, 0.3)" : "#a7f3d0",
                        boxShadow: source === "ALL" ? "0 4px 16px rgba(16, 185, 129, 0.2)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.15)"
                        }
                    }}
                >
                    {/* Sparkline decoration in top right */}
                    <Box sx={{ position: "absolute", top: 16, right: 16, opacity: 0.85 }}>
                        <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2 18 C 12 18, 16 6, 26 10 C 36 14, 44 2, 58 4"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5",
                                color: "#059669"
                            }}
                        >
                            <TrendingUp size={20} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Total Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "#059669",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        {formatCurrency(summary?.total?.amount)}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {formatCount(summary?.total?.count)} transactions
                        {Boolean(summary?.returns?.amount && summary.returns.amount > 0) && (
                            <span style={{ color: "#dc2626", marginLeft: 6, fontWeight: 600 }}>
                                (-{formatCurrency(summary.returns.amount)} returns)
                            </span>
                        )}
                    </Typography>
                </Card>

                {/* 2. Product Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("PRODUCT")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "PRODUCT" ? "#2563eb" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "PRODUCT" ? "0 4px 16px rgba(37, 99, 235, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Product Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        {formatCurrency(summary?.product?.amount)}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {formatCount(summary?.product?.count)} product sales recorded
                        {Boolean(summary?.returns?.amount && summary.returns.amount > 0) && (
                            <span style={{ color: "#dc2626", marginLeft: 6, fontWeight: 600 }}>
                                (-{formatCurrency(summary.returns.amount)} returns)
                            </span>
                        )}
                    </Typography>
                </Card>

                {/* 3. Stitching Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("STITCHING")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "STITCHING" ? "#7c3aed" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "STITCHING" ? "0 4px 16px rgba(124, 58, 237, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(124, 58, 237, 0.15)" : "#f1f5f9",
                                color: isDark ? "#a78bfa" : "#64748b"
                            }}
                        >
                            <Percent size={16} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Stitching Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        {formatCurrency(summary?.stitching?.amount)}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {formatCount(summary?.stitching?.count)} stitching transactions
                    </Typography>
                </Card>

                {/* 4. Ledger Receiving Card */}
                <Card
                    elevation={0}
                    onClick={() => handleCardClick("LEDGER")}
                    sx={{
                        width: "100%",
                        height: "100%",
                        p: 2.5,
                        borderRadius: 3,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                        border: "1px solid",
                        borderColor: source === "LEDGER" ? "#d97706" : isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        boxShadow: source === "LEDGER" ? "0 4px 16px rgba(217, 119, 6, 0.15)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#cbd5e1"
                        }
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDark ? "rgba(217, 119, 6, 0.15)" : "#f1f5f9",
                                color: isDark ? "#fbbf24" : "#64748b"
                            }}
                        >
                            <FileText size={16} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>
                            Ledger Receiving
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.4rem", md: "1.65rem" },
                            color: "text.primary",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            mb: 0.75
                        }}
                    >
                        {formatCurrency(summary?.ledger?.amount)}
                    </Typography>

                    <Typography sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, mt: "auto" }}>
                        {formatCount(summary?.ledger?.count)} ledger transactions
                    </Typography>
                </Card>
            </Box>
        </Box>
    );
}
