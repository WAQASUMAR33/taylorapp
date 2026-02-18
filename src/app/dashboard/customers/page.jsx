import prisma from "@/lib/prisma";
import CustomerManagementClient from "./CustomerManagementClient";

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
        <div>
            <div style={{ paddingTop: '24px', paddingBottom: '16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Customer Management</h1>
                    <p className="text-zinc-500 mt-1">Manage your customer database and records.</p>
                </div>
            </div>

            <CustomerManagementClient
                initialCustomers={serializedCustomers}
                accountCategories={serializedCategories}
            />
        </div>
    );
}
