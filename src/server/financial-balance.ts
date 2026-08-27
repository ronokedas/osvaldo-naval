/** Shared rules for receivable balances. Keep every consumer on the same source. */
export const EPSILON = 0.009;

export function paymentIsActive(payment: { ativo?: boolean | null }) {
  return payment.ativo !== false;
}

export function paidAmount(payments: Array<{ valor?: unknown; ativo?: boolean | null }>) {
  return payments.reduce((total, payment) => (
    paymentIsActive(payment) ? total + (Number(payment.valor) || 0) : total
  ), 0);
}

export function receivableBalance(original: unknown, payments: Array<{ valor?: unknown; ativo?: boolean | null }>) {
  return Math.max(0, (Number(original) || 0) - paidAmount(payments));
}

export function receivableStatus(original: unknown, payments: Array<{ valor?: unknown; ativo?: boolean | null }>) {
  const originalAmount = Number(original) || 0;
  const paid = paidAmount(payments);
  if (originalAmount > 0 && paid >= originalAmount - EPSILON) return "pago";
  return paid > EPSILON ? "parcial" : "pendente";
}
