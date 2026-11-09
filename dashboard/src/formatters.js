export function formatTime(value) {
  if (!value) return "Data tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

