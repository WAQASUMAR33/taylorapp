import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Customer ID is required" },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(req.url);
        const cascade = searchParams.get("cascade") === "true";

        if (cascade) {
            await prisma.$transaction(async (tx) => {
                const customerIdInt = parseInt(id);

                // 1. Delete stitching options mapping for booking items
                // Get all bookings for this customer
                const bookings = await tx.booking.findMany({
                    where: { customerId: customerIdInt },
                    select: { id: true }
                });
                const bookingIds = bookings.map(b => b.id);

                if (bookingIds.length > 0) {
                    // Delete booking item stitching options
                    await tx.booking_item_stitching_option.deleteMany({
                        where: {
                            bookingItem: {
                                bookingId: { in: bookingIds }
                            }
                        }
                    });
                    // Delete booking items
                    await tx.booking_item.deleteMany({
                        where: { bookingId: { in: bookingIds } }
                    });
                    // Delete booking staff
                    await tx.booking_staff.deleteMany({
                        where: { bookingId: { in: bookingIds } }
                    });
                }

                // Delete measurements
                await tx.measurement.deleteMany({ where: { customerId: customerIdInt } });

                // Delete ledger entries
                await tx.ledgerentry.deleteMany({ where: { customerId: customerIdInt } });

                // Delete bookings
                await tx.booking.deleteMany({ where: { customerId: customerIdInt } });

                // Delete bills (this will also delete bill items if schema has Cascade)
                // Wait, bill_item has Cascade onDelete in relation to bill
                await tx.bill.deleteMany({ where: { customerId: customerIdInt } });

                // Delete orders
                await tx.order.deleteMany({ where: { customerId: customerIdInt } });

                // Delete purchases where customer is the supplier
                await tx.purchase.deleteMany({ where: { supplierId: customerIdInt } });

                // Finally delete the customer
                await tx.customer.delete({
                    where: { id: customerIdInt },
                });
            });

            return NextResponse.json({ message: "Customer and all related records deleted successfully" });
        }

        // Check for related records that prevent deletion
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        bookings: true,
                        measurements: true,
                        ledgerEntries: true,
                        orders: true,
                        bill: true,
                        purchases: true,
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const counts = customer._count;
        const dependencies = [];
        if (counts.bookings > 0) dependencies.push(`${counts.bookings} booking(s)`);
        if (counts.measurements > 0) dependencies.push(`${counts.measurements} measurement(s)`);
        if (counts.ledgerEntries > 0) dependencies.push(`${counts.ledgerEntries} ledger entry(entries)`);
        if (counts.orders > 0) dependencies.push(`${counts.orders} order(s)`);
        if (counts.bill > 0) dependencies.push(`${counts.bill} bill(s)`);
        if (counts.purchases > 0) dependencies.push(`${counts.purchases} purchase(s)`);

        if (dependencies.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete customer who has existing: ${dependencies.join(", ")}` },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Failed to delete customer:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, fatherName, measurementNo, phone, email, address, notes, code, accountCategoryId, balance, image } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const trimmedMeasurementNo = measurementNo ? measurementNo.trim() : null;
        if (trimmedMeasurementNo) {
            const existingMeasurementNo = await prisma.customer.findFirst({
                where: {
                    measurementNo: trimmedMeasurementNo,
                    id: { not: parseInt(id) }
                }
            });
            if (existingMeasurementNo) {
                return NextResponse.json(
                    { error: `Measurement Number '${trimmedMeasurementNo}' is already assigned to customer '${existingMeasurementNo.name}'` },
                    { status: 400 }
                );
            }
        }

        const updatedCustomer = await prisma.$transaction(async (tx) => {
            const existingCustomer = await tx.customer.findUnique({
                where: { id: parseInt(id) }
            });

            if (!existingCustomer) {
                throw new Error("Customer not found");
            }

            const newBalance = balance ? parseFloat(balance) : 0;
            const currentBalance = parseFloat(existingCustomer.balance);
            const adjustment = newBalance - currentBalance;

            if (adjustment !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(id),
                        type: adjustment > 0 ? "DEBIT" : "CREDIT",
                        amount: Math.abs(adjustment),
                        description: "Balance Adjustment",
                        entryDate: new Date(),
                    }
                });
            }

            return await tx.customer.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    fatherName,
                    measurementNo: trimmedMeasurementNo,
                    phone,
                    email,
                    address,
                    notes,
                    code,
                    balance: newBalance,
                    accountCategoryId: accountCategoryId ? parseInt(accountCategoryId) : null,
                    ...(image !== undefined && { image: image || null }),
                },
                include: {
                    accountCategory: true
                }
            });
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Failed to update customer:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}
