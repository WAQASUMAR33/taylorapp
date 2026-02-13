import prisma from "@/lib/prisma";
import UserManagementClient from "./UserManagementClient";

export const metadata = {
    title: "User Management - TailorFlow",
};

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Serialize dates for client components
    const serializedUsers = users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">User Management</h1>
                    <p className="text-zinc-500 mt-1">Manage system users, roles and permissions.</p>
                </div>
            </div>

            <UserManagementClient initialUsers={serializedUsers} />
        </div>
    );
}
