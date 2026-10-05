export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UserManagementClient from "./UserManagementClient";
import { Box, Typography } from "@mui/material";
import { Users } from "lucide-react";

export const metadata = {
    title: "User Management - GRACE TAILORS",
};

export default async function UsersPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    if (session.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }
    const [users, branches] = await Promise.all([
        prisma.user.findMany({
            include: {
                branch: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    // Serialize dates for client components
    const serializedUsers = users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        branch: user.branch ? {
            ...user.branch,
            createdAt: user.branch.createdAt.toISOString(),
            updatedAt: user.branch.updatedAt.toISOString(),
        } : null,
    }));

    const serializedBranches = branches.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
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
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            User Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage system users, roles and permissions.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <UserManagementClient initialUsers={serializedUsers} initialBranches={serializedBranches} />
        </Box>
    );
}
