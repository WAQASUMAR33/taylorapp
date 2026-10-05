export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BranchManagementClient from "./BranchManagementClient";
import { Box, Typography } from "@mui/material";
import { Store } from "lucide-react";

export const metadata = {
    title: "Branch Management - GRACE TAILORS",
};

export default async function BranchesPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    if (session.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }
    const branches = await prisma.branch.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    customers: true,
                    bookings: true,
                    ledgerEntries: true,
                    receivings: true,
                }
            }
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });

    const serializedBranches = branches.map(branch => ({
        ...branch,
        createdAt: branch.createdAt.toISOString(),
        updatedAt: branch.updatedAt.toISOString(),
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
                        <Store size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Branch Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Configure business branches, logos, contact information, and branding.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <BranchManagementClient initialBranches={serializedBranches} />
        </Box>
    );
}
