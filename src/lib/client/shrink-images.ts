/**
 * Before a photo form submits, re-encode large images in the browser
 * (max 2000px long edge, JPEG q0.85) so phone photos upload fast and stay
 * under the 8 MB server limit. Replaces the input's files in place, so the
 * form still submits natively; if anything fails the originals are sent.
 */
const MAX_EDGE = 2000;
const SKIP_BELOW = 1.5 * 1024 * 1024;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < SKIP_BELOW) return file;
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function shrinkOnSubmit(form: HTMLFormElement, input: HTMLInputElement, status?: HTMLElement | null) {
  let ready = false;
  form.addEventListener("submit", async (e) => {
    if (ready || !input.files?.length) return;
    e.preventDefault();
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (submit) submit.disabled = true;
    if (status) status.textContent = `Preparing ${input.files.length} photo${input.files.length > 1 ? "s" : ""}…`;
    try {
      const dt = new DataTransfer();
      for (const f of Array.from(input.files)) dt.items.add(await shrink(f));
      input.files = dt.files;
    } catch (err) {
      console.warn("image shrink skipped:", err);
    }
    if (status) status.textContent = "Uploading…";
    ready = true;
    form.requestSubmit();
  });
}
