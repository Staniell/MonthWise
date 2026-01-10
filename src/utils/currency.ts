/**
 * Currency utility functions
 * All internal calculations use integer cents to avoid floating-point errors
 */

/**
 * Format cents to display currency string
 * @param cents - Amount in cents (e.g., 1050 = $10.50)
 * @param locale - User locale for formatting (default: 'en-US')
 * @param currency - Currency code (default: 'USD')
 */
export function formatCurrency(cents: number, locale: string = "en-US", currency: string = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string = "USD", locale: string = "en-US"): string {
  return (0)
    .toLocaleString(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, "")
    .trim();
}

/**
 * Format cents to compact display (no currency symbol, for inputs)
 * @param cents - Amount in cents
 */
export function formatForInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Parse user input string to cents
 * Handles various formats: "10.50", "10,50", "$10.50", "10"
 * @param input - User input string
 * @returns Amount in cents, or null if invalid
 */
export function parseToCents(input: string): number | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Remove currency symbols, spaces, and other non-numeric chars except . , -
  const cleaned = input.replace(/[^0-9.,\-]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  // Handle comma as decimal separator (European format)
  // If there's both comma and period, assume comma is thousands separator
  let normalized = cleaned;
  const hasComma = cleaned.includes(",");
  const hasPeriod = cleaned.includes(".");

  if (hasComma && hasPeriod) {
    // Both present: comma is thousands separator, period is decimal
    normalized = cleaned.replace(/,/g, "");
  } else if (hasComma && !hasPeriod) {
    // Only comma: treat as decimal separator
    normalized = cleaned.replace(",", ".");
  }

  const parsed = parseFloat(normalized);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }

  // Convert to cents and round to avoid floating-point issues
  return Math.round(parsed * 100);
}

/**
 * Format cents with sign indicator
 * Positive = excess (green), Negative = deficit (red)
 * @param cents - Amount in cents (can be negative)
 * @param locale - User locale
 * @param currency - Currency code
 */
export function formatWithSign(
  cents: number,
  locale: string = "en-US",
  currency: string = "USD"
): { text: string; isPositive: boolean; isNegative: boolean } {
  const isPositive = cents > 0;
  const isNegative = cents < 0;
  const prefix = isPositive ? "+" : "";
  const text = prefix + formatCurrency(cents, locale, currency);

  return { text, isPositive, isNegative };
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number, locale: string = "en-US"): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString(locale, { month: "long" });
}

/**
 * Get short month name from month number (1-12)
 */
export function getShortMonthName(month: number, locale: string = "en-US"): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString(locale, { month: "short" });
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string, locale: string = "en-US"): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a datetime string for display with time (e.g., "Jan 10, 7:15 PM")
 * SQLite stores datetime in UTC format without timezone indicator.
 * We append 'Z' to tell JavaScript it's UTC, then convert to local time.
 */
export function formatDateTime(dateString: string, locale: string = "en-US"): string {
  // SQLite datetime format: "2026-01-10 11:15:00" (UTC, no timezone indicator)
  // We need to tell JavaScript this is UTC by normalizing to ISO format with 'Z'
  const normalizedString =
    dateString.includes("T") || dateString.includes("Z") ? dateString : dateString.replace(" ", "T") + "Z";
  const date = new Date(normalizedString);

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const datePart = date.toLocaleDateString(locale, dateOptions);
  const timePart = date.toLocaleTimeString(locale, timeOptions);
  return `${datePart}, ${timePart}`;
}

/**
 * Get current date as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get current month (1-12)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}
