import prisma from "@/lib/prisma";
import CustomerManagementClient from "./CustomerManagementClient";
import { Box, Typography } from "@mui/material";
import { Users } from "lucide-react";

export const metadata = {
    title: "Customer Management - TailorFlow",
};

export default async function CustomersPage() {
    const customers = await prisma.customer.findMany({
        include: {
            accountCategory: true
        },
        orderBy: { createdAt: "desc" },
    });

    const accountCategories = await prisma.accountCategory.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    // Serialize decimals and dates
    const serializedCustomers = customers.map(customer => ({
        ...customer,
        balance: customer.balance ? parseFloat(customer.balance.toString()) : 0,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
    }));

    const serializedCategories = accountCategories.map(cat => ({
        ...cat,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
    }));

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 3,
                px: 3,
                mb: 3,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: 'primary.light',
                        borderRadius: 3,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={28} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Customer Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage your customer database and records.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <CustomerManagementClient
                initialCustomers={serializedCustomers}
                accountCategories={serializedCategories}
            />
        </Box>
    );
}
