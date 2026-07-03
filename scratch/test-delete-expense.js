const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Creating dummy expense...");
    const newExpense = await prisma.expense.create({
      data: {
        title: "Test Dummy Expense",
        date: new Date(),
        amount: 123.45,
        description: "To be deleted",
        addedBy: 1
      }
    });
    console.log("Created expense with ID:", newExpense.id);

    console.log("Deleting dummy expense...");
    const deleted = await prisma.expense.delete({
      where: { id: newExpense.id }
    });
    console.log("Deleted successfully:", deleted);
  } catch (err) {
    console.error("Error during operations:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
