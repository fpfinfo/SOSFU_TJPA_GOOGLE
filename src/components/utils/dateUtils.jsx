export function formatDateBR(dateLike) {
  if (!dateLike) return "-";

  // Se for string 'YYYY-MM-DD', formatar sem criar Date (evita offset de fuso/UTC)
  if (typeof dateLike === "string") {
    const m = dateLike.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mm, dd] = m;
      return `${dd}/${mm}/${y}`;
    }
  }

  // Fallback seguro para ISO datetimes ou objetos Date
  try {
    const d = new Date(dateLike);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "-";
  }
}