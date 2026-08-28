export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

// CurrencyInput is a cents mask: each digit advances the amount one position
// to the left. Therefore `200000` becomes R$ 2.000,00 while typing and pasted
// values such as `R$ 2.000,00` keep their expected value.
export const parseCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents / 100 : 0;
};

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());

export const isValidCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!/^(\d)\1+$/.test(digits) && digits.length === 11) {
    const checksum = (base: string, weights: number[]) => weights.reduce((sum, weight, index) => sum + Number(base[index]) * weight, 0);
    const first = 11 - (checksum(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11);
    const second = 11 - (checksum(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11);
    return Number(digits[9]) === (first >= 10 ? 0 : first) && Number(digits[10]) === (second >= 10 ? 0 : second);
  }
  if (!/^(\d)\1+$/.test(digits) && digits.length === 14) {
    const check = (base: string) => {
      let factor = base.length - 7;
      const total = [...base].reduce((sum, digit) => {
        const next = sum + Number(digit) * factor;
        factor = factor === 2 ? 9 : factor - 1;
        return next;
      }, 0);
      const remainder = total % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    return Number(digits[12]) === check(digits.slice(0, 12)) && Number(digits[13]) === check(digits.slice(0, 13));
  }
  return false;
};
