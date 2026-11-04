export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: unitIndex > 1 ? 1 : 0 }).format(value)} ${units[unitIndex]}`;
}

export function formatActivity(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
