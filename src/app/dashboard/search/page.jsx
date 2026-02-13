import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, Users, Scissors, Package } from "lucide-react";

export const metadata = {
    title: "Search Results - TailorFlow",
};

export default async function SearchPage({ searchParams }) {
    const { q: query } = await searchParams || {};

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Enter a search term to find customers, bookings, or products.</p>
            </div>
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Search Results</h1>
                <p className="text-zinc-500 mt-1">Showing results for "{query}"</p>
            </div>

            {!hasResults && (
                <div className="p-12 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <p className="text-zinc-500">No matching records found.</p>
                </div>
            )}

            {customers.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="text-blue-600" size={20} />
                        <h2 className="text-xl font-semibold text-zinc-900">Customers</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {customers.map(c => (
                            <Link href="/dashboard/customers" key={c.id} className="block p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-500 transition-colors shadow-sm">
                                <h3 className="font-semibold text-zinc-900">{c.name}</h3>
                                {c.phone && <p className="text-sm text-zinc-500">{c.phone}</p>}
                                {c.email && <p className="text-xs text-zinc-400 mt-1">{c.email}</p>}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {bookings.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Scissors className="text-purple-600" size={20} />
                        <h2 className="text-xl font-semibold text-zinc-900">Bookings</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map(b => (
                            <div key={b.id} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">{b.bookingNumber}</h3>
                                        <p className="text-sm text-zinc-600 mt-1">Customer: {b.customer.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        b.status === 'READY' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-zinc-100 text-zinc-700'
                                        }`}>
                                        {b.status}
                                    </span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-zinc-100 flex justify-between items-center">
                                    <span className="text-xs text-zinc-400">
                                        {new Date(b.bookingDate).toLocaleDateString()}
                                    </span>
                                    <Link href="/dashboard/bookings" className="text-sm font-medium text-blue-600 hover:underline">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {products.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="text-orange-600" size={20} />
                        <h2 className="text-xl font-semibold text-zinc-900">Products</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {products.map(p => (
                            <Link href="/dashboard/products" key={p.id} className="block p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-500 transition-colors shadow-sm">
                                <div className="flex justify-between">
                                    <h3 className="font-semibold text-zinc-900">{p.name}</h3>
                                    <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{p.sku}</span>
                                </div>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="text-sm text-zinc-500">Stock: {p.quantity}</span>
                                    {/* Cost/Price are Decimals, convert safely if needed, though mostly relying on page content here */}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
