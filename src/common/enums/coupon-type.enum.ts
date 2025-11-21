export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',         // Descuento porcentual (ej: 10%)
  FIXED_AMOUNT = 'FIXED_AMOUNT',     // Descuento fijo (ej: -$10.00)
  RECHARGE_CREDIT = 'RECHARGE_CREDIT', // Recarga saldo a la billetera
  GIFT_CARD = 'GIFT_CARD',           // Tarjeta de regalo (Excedente va a billetera)
}