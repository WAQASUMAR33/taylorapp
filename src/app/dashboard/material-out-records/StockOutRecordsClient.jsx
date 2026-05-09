"use client";

import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Button,
    Tooltip,
} from "@mui/material";
import { Search, TrendingDown, Package, X as XIcon } from "lucide-react";

export default function StockOutRecordsClient({ initialRecords, materials }) {
    const [records] = useState(initialRecords);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMaterial, setFilterMaterial] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const hasDateFilter = dateFrom || dateTo;

    const clearDateFilter = () => { setDateFrom(""); setDateTo(""); setPage(0); };

    const filtered = useMemo(() => {
        return records.filter((r) => {
            const matchMaterial =
                filterMaterial === "all" || r.material.id === parseInt(filterMaterial);
            const matchSearch =
                r.material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

            const recordDate = new Date(r.movedAt);
            recordDate.setHours(0, 0, 0, 0);
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;
            if (to) to.setHours(23, 59, 59, 999);
            const matchDate =
                (!from || recordDate >= from) && (!to || new Date(r.movedAt) <= to);

            return matchMaterial && matchSearch && matchDate;
        });
    }, [records, searchQuery, filterMaterial, dateFrom, dateTo]);

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Summary stats
    const totalOutQty = filtered.reduce((sum, r) => sum + r.quantity, 0);
    const totalOutValue = filtered.reduce((sum, r) => sum + r.quantity * r.material.price, 0);

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Summary cards ───────────────────────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            Total Out Records
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
                            {filtered.length}
                        </Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            Total Out Quantity
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ mt: 0.5 }}>
                            {totalOutQty.toFixed(2)} <Typography component="span" variant="body2" color="text.secondary">units</Typography>
                        </Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            Total Out Value
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
                            Rs. {totalOutValue.toLocaleString()}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Filters ─────────────────────────────────── */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                    placeholder="Search by material or description…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    sx={{ flex: 1, minWidth: 240 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Material</InputLabel>
                    <Select
                        value={filterMaterial}
                        label="Filter by Material"
                        onChange={(e) => { setFilterMaterial(e.target.value); setPage(0); }}
                    >
                        <MenuItem value="all">All Materials</MenuItem>
                        {materials.map((m) => (
                            <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="From Date"
                    type="date"
                    size="small"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                />
                <TextField
                    label="To Date"
                    type="date"
                    size="small"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                />
                {hasDateFilter && (
                    <Tooltip title="Clear date filter">
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            onClick={clearDateFilter}
                            startIcon={<XIcon size={15} />}
                            sx={{ borderRadius: 2, textTransform: "none", whiteSpace: "nowrap" }}
                        >
                            Clear Dates
                        </Button>
                    </Tooltip>
                )}
            </Box>

            {/* ── Table ───────────────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Out Qty</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Unit Price</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Out Value</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginated.length > 0 ? (
                                paginated.map((record, idx) => (
                                    <TableRow
                                        key={record.id}
                                        sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                    >
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                {page * rowsPerPage + idx + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 1.5,
                                                        bgcolor: "error.light",
                                                        color: "error.main",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Package size={16} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {record.material.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID #{record.material.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`-${record.quantity}`}
                                                size="small"
                                                color="error"
                                                variant="filled"
                                                sx={{ borderRadius: 1, fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={500}>
                                                Rs. {record.material.price.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={700} color="error.main">
                                                Rs. {(record.quantity * record.material.price).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 260 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                {record.notes || <span style={{ color: "#bbb" }}>—</span>}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(record.movedAt).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                {new Date(record.movedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <TrendingDown size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                            No out stock records found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </Card>
        </Box>
    );
}
