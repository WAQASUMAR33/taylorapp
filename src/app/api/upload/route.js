import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = file.name.split(".").pop().toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "customers");

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/uploads/customers/${filename}` }, { status: 201 });
    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
