import prisma from "@/lib/prisma";
import EmployeeManagementClient from "./EmployeeManagementClient";

export const metadata = {
    title: "Employee Management - TailorFlow",
};

export default async function EmployeesPage() {
    const employees = await prisma.employee.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Serialize
    const serializedEmployees = employees.map(emp => ({
        ...emp,
        salary: emp.salary ? emp.salary.toString() : "0",
        createdAt: emp.createdAt.toISOString(),
        updatedAt: emp.updatedAt.toISOString(),
    }));

    return (
        <div>
            <div style={{ paddingTop: '24px', paddingBottom: '16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ paddingLeft: '24px', paddingRight: '24px' }} dir="rtl">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-urdu">ملازمین کی مینجمنٹ</h1>
                    <p className="text-zinc-500 mt-1 font-urdu">اپنے سلائی اسٹاف، کردار اور تنخواہ کی معلومات کا انتظام کریں۔</p>
                </div>
            </div>

            <EmployeeManagementClient initialEmployees={serializedEmployees} />
        </div>
    );
}
