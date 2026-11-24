export interface Coupon {
  code: string;
  percentOff: number;
  expiresAt: Date;
}

export interface Cart {
  total: number;
}

export interface ApplyResult {
  total: number;
  discountApplied: number;
  receiptLine?: string;
  error?: string;
}

export function isExpired(coupon: Coupon, now: Date = new Date()): boolean {
  return coupon.expiresAt.getTime() < now.getTime();
}

export function applyCoupon(cart: Cart, coupon: Coupon, now: Date = new Date()): ApplyResult {
  if (isExpired(coupon, now)) {
    return {
      total: cart.total,
      discountApplied: 0,
      error: `Cupom ${coupon.code} expirado`,
    };
  }
  if (coupon.percentOff <= 0 || coupon.percentOff > 100) {
    return {
      total: cart.total,
      discountApplied: 0,
      error: `Cupom ${coupon.code} inválido`,
    };
  }
  const discountApplied = Math.round((cart.total * coupon.percentOff) / 100);
  const total = cart.total - discountApplied;
  return {
    total,
    discountApplied,
    receiptLine: `Desconto ${coupon.code}: -${discountApplied}`,
  };
}
