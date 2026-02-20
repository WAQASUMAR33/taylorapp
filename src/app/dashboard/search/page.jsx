
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, Users, Scissors, Package } from "lucide-react";
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Divider
} from "@mui/material";

export const metadata = {
    title: "Search Results - TailorFlow",
};

export default async function SearchPage({ searchParams }) {
    const { q: query } = await searchParams || {};

    if (!query) {
        return (
            <Container maxWidth="lg" sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={48} color="#9ca3af" style={{ marginBottom: 16, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">
                    Enter a search term to find customers, bookings, or products.
                </Typography>
            </Container>
        );
    }

    // Parallel data fetching
    const [customers, bookings, products] = await Promise.all([
        prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { phone: { contains: query } },
                    { email: { contains: query } }
                ]
            },
            take: 5
        }),
        prisma.booking.findMany({
            where: {
                OR: [
                    { bookingNumber: { contains: query } },
                    { customer: { name: { contains: query } } }
                ]
            },
            include: { customer: true },
            take: 5
        }),
        prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { sku: { contains: query } }
                ]
            },
            take: 5
        })
    ]);

    const hasResults = customers.length > 0 || bookings.length > 0 || products.length > 0;

    return (
        <Container maxWidth="xl" disableGutters sx={{ px: 3, py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    Search Results
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Showing results for &quot;{query}&quot;
                </Typography>
            </Box>

            {!hasResults && (
                <Box sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: 'divider'
                }}>
                    <Typography color="text.secondary">No matching records found.</Typography>
                </Box>
            )}

            <Stack spacing={4}>
                {customers.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, color: 'primary.main', display: 'flex' }}>
                                <Users size={20} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">Customers</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {customers.map(c => (
                                <Grid item xs={12} md={6} lg={4} key={c.id}>
                                    <Link href="/dashboard/customers" style={{ textDecoration: 'none' }}>
                                        <Card sx={{
                                            height: '100%',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3,
                                                borderColor: 'primary.main'
                                            },
                                            border: 1,
                                            borderColor: 'divider'
                                        }} elevation={0}>
                                            <CardContent>
                                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                                    {c.name}
                                                </Typography>
                                                {c.phone && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {c.phone}
                                                    </Typography>
                                                )}
                                                {c.email && (
                                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                                        {c.email}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {bookings.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'secondary.light', borderRadius: 1.5, color: 'secondary.main', display: 'flex' }}>
                                <Scissors size={20} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">Bookings</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {bookings.map(b => (
                                <Grid item xs={12} md={6} lg={4} key={b.id}>
                                    <Card sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        height: '100%',
                                        position: 'relative',
                                        overflow: 'visible'
                                    }} elevation={0}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                                        {b.bookingNumber}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Customer: {b.customer.name}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={b.status}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        bgcolor: b.status === 'PENDING' ? 'warning.light' :
                                                            b.status === 'READY' ? 'success.light' :
                                                                'action.selected',
                                                        color: b.status === 'PENDING' ? 'warning.dark' :
                                                            b.status === 'READY' ? 'success.dark' :
                                                                'text.secondary'
                                                    }}
                                                />
                                            </Box>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" color="text.disabled">
                                                    {new Date(b.bookingDate).toLocaleDateString()}
                                                </Typography>
                                                <Link href="/dashboard/bookings" style={{ textDecoration: 'none' }}>
                                                    <Typography variant="body2" color="primary" fontWeight="500" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                                        View Details
                                                    </Typography>
                                                </Link>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {products.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1.5, color: 'warning.dark', display: 'flex' }}>
                                <Package size={20} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">Products</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {products.map(p => (
                                <Grid item xs={12} md={6} lg={4} key={p.id}>
                                    <Link href="/dashboard/products" style={{ textDecoration: 'none' }}>
                                        <Card sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            height: '100%',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3,
                                                borderColor: 'primary.main'
                                            }
                                        }} elevation={0}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                                        {p.name}
                                                    </Typography>
                                                    <Chip
                                                        label={p.sku}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontFamily: 'monospace', borderRadius: 1, height: 24 }}
                                                    />
                                                </Box>
                                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Stock: {p.quantity}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Stack>
        </Container>
    );
}
