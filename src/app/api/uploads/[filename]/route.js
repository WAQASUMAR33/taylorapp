import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const TYPES = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
};

export async function GET(req, { params }) {
    const { filename } = await params;
    // Prevent path traversal: only a plain file name is accepted
    if (!filename || filename !== path.basename(filename)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ext = path.extname(filename).slice(1).toLowerCase();
    const type = TYPES[ext];
    if (!type) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
        const data = await readFile(path.join(process.cwd(), "uploads", filename));
        return new NextResponse(data, {
            headers: {
                "Content-Type": type,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}
