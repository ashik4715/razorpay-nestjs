const ZERO_DECIMAL = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

export function currencyExponent(currency: string): number {
  if (ZERO_DECIMAL.has(currency)) return 0;
  if (THREE_DECIMAL.has(currency)) return 3;
  return 2;
}

export function toMinorUnits(amount: number, currency: string): number {
  const exponent = currencyExponent(currency);
  const minor = Math.round(amount * 10 ** exponent);
  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new Error(`Invalid amount "${amount}" for currency "${currency}"`);
  }
  return minor;
}
