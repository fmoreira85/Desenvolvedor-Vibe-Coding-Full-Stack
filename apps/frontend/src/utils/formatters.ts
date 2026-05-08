export const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const formatRelativeTime = (value: string) => {
  const target = new Date(value).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absSeconds = Math.round(Math.abs(diffMs) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(Math.round(diffMs / 1000), "second");
  }

  const absMinutes = Math.round(absSeconds / 60);
  if (absMinutes < 60) {
    return formatter.format(Math.round(diffMs / 60000), "minute");
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return formatter.format(Math.round(diffMs / 3600000), "hour");
  }

  const absDays = Math.round(absHours / 24);
  if (absDays < 7) {
    return formatter.format(Math.round(diffMs / 86400000), "day");
  }

  return new Date(value).toLocaleDateString("pt-BR");
};

export const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
