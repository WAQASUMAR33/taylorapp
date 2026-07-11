const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Starting optimized database cleanup for bookings and sales returns...");
    
    // 1. Delete all transaction records inside a transaction block
    await prisma.$transaction(async (tx) => {
        // Disable foreign key checks
        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

        // Delete stitching options, items, staff, orders, and bookings
        const deletedOptions = await tx.booking_item_stitching_option.deleteMany({});
        console.log(`Deleted ${deletedOptions.count} booking item stitching options.`);

        const deletedBookingItems = await tx.booking_item.deleteMany({});
        console.log(`Deleted ${deletedBookingItems.count} booking items.`);

        const deletedStaff = await tx.booking_staff.deleteMany({});
        console.log(`Deleted ${deletedStaff.count} booking staff records.`);

        const deletedOrders = await tx.order.deleteMany({});
        console.log(`Deleted ${deletedOrders.count} stitching orders.`);

        const deletedBookings = await tx.booking.deleteMany({});
        console.log(`Deleted ${deletedBookings.count} bookings.`);

        // Delete sale returns
        const deletedReturnItems = await tx.sale_return_item.deleteMany({});
        console.log(`Deleted ${deletedReturnItems.count} sale return items.`);

        const deletedReturns = await tx.sale_return.deleteMany({});
        console.log(`Deleted ${deletedReturns.count} sale returns.`);

        // Delete associated ledger entries
        const deletedLedgers = await tx.ledgerentry.deleteMany({
            where: {
                OR: [
                    { bookingId: { not: null } },
                    { saleReturnId: { not: null } }
                ]
            }
        });
        console.log(`Deleted ${deletedLedgers.count} ledger entries related to bookings and returns.`);

        // Re-enable foreign key checks
        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
    }, {
        timeout: 30000 // 30 seconds timeout
    });

    console.log("All booking and sales return records deleted successfully.");
    console.log("Recalculating customer balances with optimized aggregation...");

    // 2. Set all customer balances to 0 in a single query
    const resetResult = await prisma.customer.updateMany({
        data: { balance: 0 }
    });
    console.log(`Reset balances to 0 for ${resetResult.count} customers.`);

    // 3. Group remaining ledger entries by customerId and type to calculate sums
    const groupedEntries = await prisma.ledgerentry.groupBy({
        by: ['customerId', 'type'],
        _sum: {
            amount: true
        }
    });

    // Compute net balance per customer from remaining ledger entries (Opening Balances or manual entries)
    const balanceMap = {};
    for (const group of groupedEntries) {
        const cid = group.customerId;
        const type = group.type;
        const sum = parseFloat(group._sum.amount) || 0;
        
        if (!balanceMap[cid]) {
            balanceMap[cid] = 0;
        }
        
        if (type === "DEBIT") {
            balanceMap[cid] += sum;
        } else if (type === "CREDIT") {
            balanceMap[cid] -= sum;
        }
    }

    // 4. Update only customers who have non-zero balance
    const customerIdsToUpdate = Object.keys(balanceMap);
    console.log(`Updating non-zero balances for ${customerIdsToUpdate.length} customers...`);

    let updatedCount = 0;
    for (const cidStr of customerIdsToUpdate) {
        const cid = parseInt(cidStr);
        const bal = balanceMap[cidStr];
        
        await prisma.customer.update({
            where: { id: cid },
            data: { balance: bal }
        });
        updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} customer profile balances.`);
    console.log("Database cleanup completed successfully.");
}

main()
    .catch((err) => {
        console.error("Error running database cleanup:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
