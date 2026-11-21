// Sends a shopping-list photo to the Wafar backend (POST /demo/shopping-list),
// which reads it with Claude. In development Vite proxies /api to the backend
// (vite.config.ts). Set VITE_API_URL to call a deployed backend instead.

export type ListReading = {
  kind: "shopping_list" | "receipt" | "other";
  issues: ("blurry" | "cut_off" | "partly_unreadable")[];
  items: { raw_text: string; quantity: number; unit: string | null; product_id: string | null }[];
  basket: { lines: { product_id: string; quantity: number }[]; unmatched: string[] };
};

export type ListReadError = "not_configured" | "unreadable" | "rate_limited" | "offline" | "failed";
export type ListReadResult = { ok: true; reading: ListReading } | { ok: false; error: ListReadError };

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
const LONG_EDGE = 1568; // Larger photos cost more tokens without reading better.

/** Scales a photo (data: URL) down to at most 1568 px on its long edge and re-encodes it as JPEG. */
export async function prepareImage(dataUrl: string): Promise<{ media_type: "image/jpeg"; data: string }> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, LONG_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.fillStyle = "#fff"; // Transparent PNGs would otherwise turn black.
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { media_type: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "" };
}

export async function readShoppingList(dataUrl: string, catalogue: { id: string; name: string; name_ar: string }[], signal?: AbortSignal): Promise<ListReadResult> {
  let image: Awaited<ReturnType<typeof prepareImage>>;
  try { image = await prepareImage(dataUrl); } catch { return { ok: false, error: "unreadable" }; }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/demo/shopping-list`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image, catalogue }), signal });
  } catch {
    return { ok: false, error: "offline" };
  }
  if (response.ok) {
    try { return { ok: true, reading: (await response.json()) as ListReading }; } catch { return { ok: false, error: "failed" }; }
  }
  // The backend always answers errors as JSON {"error": "..."}; anything else means it isn't running
  // (Vite's proxy then answers with its own error page).
  let code: unknown;
  try { code = ((await response.json()) as { error?: unknown }).error; } catch { return { ok: false, error: "offline" }; }
  if (code === "not_configured") return { ok: false, error: "not_configured" };
  if (code === "unreadable") return { ok: false, error: "unreadable" };
  if (code === "rate_limited") return { ok: false, error: "rate_limited" };
  return { ok: false, error: typeof code === "string" ? "failed" : "offline" };
}
