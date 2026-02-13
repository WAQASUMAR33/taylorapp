import prisma from "@/lib/prisma";
import BankManagementClient from "./BankManagementClient";

export const metadata = {
    title: "Bank Management - TailorFlow",
};

export default async function BanksPage() {
    const banks = await prisma.bank.findMany({
        orderBy: { name: "asc" },
    });

    const serializedBanks = banks.map(b => ({
        ...b,
        balance: b.balance.toString(),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
    }));

    return (
        <div className="min-h-screen bg-zinc-50/50">
            <div className="pt-8 pb-6 bg-white border-b border-zinc-200">
                <div className="px-6">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Bank Management</h1>
                    <p className="text-zinc-500 mt-1">Manage your bank accounts and monitor balances.</p>
                </div>
            </div>

            <div className="p-6">
                <BankManagementClient initialBanks={serializedBanks} />
            </div>
        </div>
    );
}
