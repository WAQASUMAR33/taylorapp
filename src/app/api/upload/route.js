import { NextResponse } from "next/server";

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

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const ext = file.name.split(".").pop().toLowerCase();
        const base64Data = `data:${file.type};base64,${base64}`;

        const uploadUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL;
        const backUrl = process.env.NEXT_PUBLIC_IMAGE_BACK_URL;

        // Send base64 image to PHP endpoint
        const phpRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, ext }),
        });

        const rawText = await phpRes.text();

        if (!phpRes.ok) {
            throw new Error("PHP upload failed: " + rawText);
        }

        let phpJson;
        try {
            phpJson = JSON.parse(rawText);
        } catch {
            throw new Error("PHP returned non-JSON: " + rawText);
        }

        // Accept either { filename } or { url } or { path } or { file }
        const filename = phpJson.image_url || phpJson.filename || phpJson.file || phpJson.path || phpJson.name;
        if (!filename && !phpJson.url) {
            throw new Error(phpJson.error || phpJson.message || "Upload failed: " + rawText);
        }

        const url = phpJson.url || `${backUrl}/${filename}`;
        return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
