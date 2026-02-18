export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// POST: Upload community post media
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    // Validate all files before uploading
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 5MB limit` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" has unsupported type. Allowed: JPEG, PNG, GIF, WebP` },
          { status: 400 }
        );
      }
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${Date.now()}-${sanitizedName}`;
      const storagePath = `community/${user.id}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      const { error: uploadError } = await supabase.storage
        .from("gynergy")
        .upload(storagePath, buffer, {
          contentType: file.type,
        });

      if (uploadError) {
        // Clean up any already-uploaded files
        if (uploadedUrls.length > 0) {
          const pathsToDelete = uploadedUrls
            .map((url) => {
              const parts = url.split("/storage/v1/object/public/gynergy/");
              return parts[1] || "";
            })
            .filter(Boolean);
          if (pathsToDelete.length > 0) {
            await supabase.storage.from("gynergy").remove(pathsToDelete);
          }
        }
        return NextResponse.json({ error: `Failed to upload "${file.name}"` }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("gynergy").getPublicUrl(storagePath);

      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
