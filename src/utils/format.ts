/**
 * Format currency using en-RW locale and the garage's configured currency.
 */
export function formatCurrency(amount: number, currencyCode: string = 'RWF'): string {
  try {
    const cleanAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currencyCode || 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cleanAmount);
  } catch (error) {
    return `${currencyCode || 'RWF'} ${amount}`;
  }
}

/**
 * Format timestamp or ISO string using en-GB locale. Returns '—' if missing or invalid.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return '—';
  }
}
