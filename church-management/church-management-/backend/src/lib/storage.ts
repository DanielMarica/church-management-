import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { supabase } from "./supabase";
import sharp from "sharp";

const execAsync = promisify(exec);
const BUCKET = "lesson-materials";

const PDFTOPPM =
  process.env.NODE_ENV === "production"
    ? "/usr/bin/pdftoppm"
    : "/opt/homebrew/bin/pdftoppm";

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
): Promise<string> {
  const ext = path.extname(originalName);
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function generatePdfPreview(
  pdfBuffer: Buffer,
): Promise<string | null> {
  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const tmpPdf = path.join(tmpDir, `pdf-${timestamp}.pdf`);
  const tmpBase = path.join(tmpDir, `pdf-${timestamp}`);

  try {
    fs.writeFileSync(tmpPdf, pdfBuffer);

    await execAsync(
      `${PDFTOPPM} -png -f 1 -l 1 -r 150 "${tmpPdf}" "${tmpBase}"`,
    );

    // pdftoppm génère -1.png ou -01.png selon la version
    const generated = fs
      .readdirSync(tmpDir)
      .find((f) => f.startsWith(path.basename(tmpBase)) && f.endsWith(".png"));

    if (!generated) throw new Error("Preview generation failed");

    const generatedFile = path.join(tmpDir, generated);
    const rawBuffer = fs.readFileSync(generatedFile);
    const imgBuffer = await sharp(rawBuffer)
      .resize(400, 300, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    const previewUrl = await uploadFile(
      imgBuffer,
      "preview.jpg",
      "image/jpeg",
      "previews",
    );

    // Cleanup
    try {
      fs.unlinkSync(generatedFile);
    } catch {}

    return previewUrl;
  } catch (error) {
    console.warn("PDF preview generation failed:", error);
    return null;
  } finally {
    try {
      fs.unlinkSync(tmpPdf);
    } catch {}
  }
}

export async function deleteFile(publicUrl: string): Promise<void> {
  const url = new URL(publicUrl);
  const parts = url.pathname.split(`/object/public/${BUCKET}/`);
  if (parts.length < 2) return;

  const filePath = parts[1];
  await supabase.storage.from(BUCKET).remove([filePath]);
}
