// client/src/lib/dateUtils.ts

// Nairobi timezone is UTC+3 (East Africa Time)
const NAIROBI_TIMEZONE = 'Africa/Nairobi';

export function formatLocalTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: NAIROBI_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatLocalDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: NAIROBI_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatLocalTimeOnly(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: NAIROBI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// For relative time (e.g., "2 hours ago") in Nairobi time
export function getRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatLocalDate(dateString);
}