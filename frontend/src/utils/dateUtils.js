/**
 * Date and time utilities for Reikage Watch.
 * Handles parsing UTC timestamps stored by SQLite/server
 * and computes accurate real-time relative time ("just now", "5m ago", etc.)
 */

export function parseUtcDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'number') return new Date(dateInput);

  let str = String(dateInput).trim();

  // SQLite CURRENT_TIMESTAMP returns UTC time as "YYYY-MM-DD HH:MM:SS".
  // If the string lacks a timezone specifier ('Z' or '+/-HH:mm'),
  // browsers default to parsing it as local time, causing huge timezone offsets.
  // We append 'Z' to treat it strictly as UTC.
  if (!str.includes('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(dateInput) : parsed;
}

export function formatTimeAgo(dateString) {
  if (!dateString) return 'just now';
  const date = parseUtcDate(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If clock skew or uploaded less than a minute ago
  if (diffSec < 60) return 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1mo ago';
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

export function formatVideoDuration(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }
  const totalSec = Math.round(seconds);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
