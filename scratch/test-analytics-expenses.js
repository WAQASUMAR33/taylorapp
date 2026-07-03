const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test(from, to) {
  try {
    let fromDate = null;
    let toDate = null;
    const where = {};
    if (from || to) {
        where.bookingDate = {};
        if (from) {
            fromDate = new Date(from);
            where.bookingDate.gte = fromDate;
        }
        if (to) {
            toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            where.bookingDate.lte = toDate;
        }
    }

    console.log("Parameters input:", { from, to });
    console.log("Parsed Date objects:", { fromDate, toDate });

    // --- Expenses between dates ---
    const expenseWhere = {};
    if (fromDate || toDate) {
        expenseWhere.date = {};
        if (fromDate) expenseWhere.date.gte = fromDate;
        if (toDate) expenseWhere.date.lte = toDate;
    }
    
    console.log("expenseWhere query:", expenseWhere);
    
    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    console.log("Expenses found count:", expenses.length);
    console.log("Expenses details:", expenses.map(e => ({ id: e.id, date: e.date, amount: e.amount, title: e.title })));
    const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    console.log("Total expenses calculated:", totalExpenses);

  } catch (err) {
    console.error(err);
  }
}

async function main() {
  // Simulate today is 2026-06-13
  // Test 1: From 2026-06-01 to 2026-06-13
  console.log("--- TEST 1: From 2026-06-01 to 2026-06-13 ---");
  await test("2026-06-01", "2026-06-13");

  // Test 2: From 2026-06-10 to 2026-06-13 (should exclude Ali salary id: 1 which is on 2026-06-09 and salary abc id: 2 on 2026-06-01)
  console.log("\n--- TEST 2: From 2026-06-10 to 2026-06-13 ---");
  await test("2026-06-10", "2026-06-13");

  // Test 3: No parameters passed (should return all expenses)
  console.log("\n--- TEST 3: No parameters ---");
  await test(null, null);

  await prisma.$disconnect();
}

main();
