import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

const allowedHost = "github.com";

export async function openExternalUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== allowedHost) {
    throw new Error("Só é possível abrir ligações HTTPS para o GitHub.");
  }

  if (isTauri()) {
    await openUrl(url.href);
    return;
  }

  window.open(url.href, "_blank", "noopener,noreferrer");
}
