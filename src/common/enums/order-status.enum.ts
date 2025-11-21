export enum OrderStatus {
  PENDING = 'PENDING',             // Creada, esperando acción (ej: subir comprobante)
  PENDING_PAYMENT = 'PENDING_PAYMENT', // Esperando confirmación de pasarela (Wompi)
  PAID = 'PAID',                   // Pagada exitosamente
  PREPARING = 'PREPARING',         // En bodega
  SHIPPED = 'SHIPPED',             // Enviada
  DELIVERED = 'DELIVERED',         // Entregada
  CANCELLED = 'CANCELLED',         // Cancelada
  REJECTED = 'REJECTED'            // Rechazada por el banco
}

export enum PaymentMethod {
  WALLET = 'WALLET',               // Créditos internos
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', // Contraentrega
  BANK_TRANSFER = 'BANK_TRANSFER', // Transferencia Bancaria
  WOMPI = 'WOMPI',                 // Pasarela
}