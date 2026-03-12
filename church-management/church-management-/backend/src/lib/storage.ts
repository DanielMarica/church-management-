import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { supabase } from "./supabase";

const execAsync = promisify(exec);
const BUCKET = "lesson-materials";

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
): Promise<string> {
  const ext = path.extname(originalName);
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function generatePdfPreview(pdfBuffer: Buffer): Promise<string | null> {
  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const tmpPdf = path.join(tmpDir, `pdf-${timestamp}.pdf`);
  const tmpPng = path.join(tmpDir, `pdf-${timestamp}.png`);

  try {
    fs.writeFileSync(tmpPdf, pdfBuffer);

    await execAsync(`pdftoppm -png -f 1 -l 1 -r 150 "${tmpPdf}" "${tmpPng.replace(".png", "")}"`);

    const generatedFile = `${tmpPng.replace(".png", "")}-1.png`;

    if (!fs.existsSync(generatedFile)) {
      throw new Error("Preview generation failed");
    }

    const imgBuffer = fs.readFileSync(generatedFile);
    const previewUrl = await uploadFile(imgBuffer, "preview.png", "image/png", "previews");

    return previewUrl;
  } catch (error) {
    console.warn("PDF preview generation failed:", error);
    return null;
  } finally {
    try {
      fs.unlinkSync(tmpPdf);
    } catch {}
    try {
      fs.unlinkSync(`${tmpPng.replace(".png", "")}-1.png`);
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
