export const DEFAULT_COMMISSION_RATE_BPS = 1000;

export function calculateCommissionCents(subtotalCents, commissionRateBps) {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new RangeError("Subtotal must be a non-negative safe integer.");
  }

  if (
    !Number.isSafeInteger(commissionRateBps) ||
    commissionRateBps < 0 ||
    commissionRateBps > 10000
  ) {
    throw new RangeError("Commission rate must be between 0 and 10000 bps.");
  }

  const commissionCents =
    (BigInt(subtotalCents) * BigInt(commissionRateBps) + 5000n) / 10000n;

  if (commissionCents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Commission exceeds the safe integer range.");
  }

  return Number(commissionCents);
}
