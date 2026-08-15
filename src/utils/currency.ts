/**
 * Financial Money Utilities
 * To avoid floating-point inaccuracies, money is internally stored as minor units (e.g., paise/cents).
 * For INR: ₹100.50 is stored as 10050 paise.
 */

/**
 * Converts a decimal major unit amount (e.g. 100.50) into integer minor units (paise: 10050).
 */
export function toMinorUnits(amountMajor: number | string): number {
  const num = typeof amountMajor === 'string' ? parseFloat(amountMajor.replace(/,/g, '')) : amountMajor;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer minor units (paise: 10050) to major units (100.50).
 */
export function toMajorUnits(amountMinor: number): number {
  return amountMinor / 100;
}

/**
 * Formats minor units (paise) into a localized currency string.
 * Example: formatCurrency(10050, '₹') => "₹100.50"
 */
export function formatCurrency(amountMinor: number, currencySymbol: string = '₹'): string {
  const major = toMajorUnits(amountMinor);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(major));

  const sign = amountMinor < 0 ? '-' : '';
  return `${sign}${currencySymbol}${formatted}`;
}

/**
 * Formats minor units without decimals if it's a whole number, or with 2 decimals if not.
 */
export function formatCompactCurrency(amountMinor: number, currencySymbol: string = '₹'): string {
  const major = toMajorUnits(amountMinor);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(major));

  const sign = amountMinor < 0 ? '-' : '';
  return `${sign}${currencySymbol}${formatted}`;
}

/**
 * Parses user text input (e.g. "100.50" or "10,000") into integer minor units.
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
