import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RESET_PASSWORD = "DildilPakistan786@786@waqas";

export async function POST(req) {
    try {
        const { password } = await req.json();

        if (password !== RESET_PASSWORD) {
            return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
        }

        // Delete in FK-safe order (children before parents)
        await prisma.$transaction([
            // 1. Ledger entries (refs: customer, purchase, booking)
            prisma.ledgerentry.deleteMany(),
            // 2. Purchase payments (refs: purchase, bank)
            prisma.purchase_payment.deleteMany(),
            // 3. Purchase items (refs: purchase, product)
            prisma.purchase_item.deleteMany(),
            // 4. Booking items (refs: booking, product)
            prisma.booking_item.deleteMany(),
            // 5. Stock movements (refs: product)
            prisma.stockmovement.deleteMany(),
            // 6. Material movements (refs: material)
            prisma.materialmovement.deleteMany(),
            // 7. Bills (refs: customer)
            prisma.bill.deleteMany(),
            // 8. Measurements (refs: customer)
            prisma.measurement.deleteMany(),
            // 9. Orders (refs: customer, employee)
            prisma.order.deleteMany(),
            // 10. Bookings (refs: customer, employee; cascade-deletes booking_items)
            prisma.booking.deleteMany(),
            // 11. Purchases (refs: customer)
            prisma.purchase.deleteMany(),
            // 12. Materials
            prisma.material.deleteMany(),
            // 13. Products (refs: category)
            prisma.product.deleteMany(),
            // 14. Banks
            prisma.bank.deleteMany(),
            // 15. Employees
            prisma.employee.deleteMany(),
            // 16. Customers (refs: accountCategory)
            prisma.customer.deleteMany(),
            // 17. Account categories
            prisma.accountCategory.deleteMany(),
            // 18. Product categories
            prisma.category.deleteMany(),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset data error:", error);
        return NextResponse.json({ error: "Failed to reset data. Please try again." }, { status: 500 });
    }
}
