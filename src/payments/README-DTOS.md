# DTOs Creados para Flujo de Pagos Wompi

## 1. InitiateRechargeDto
**Ubicación**: `src/credits/dto/initiate-recharge.dto.ts`

**Propósito**: Validar solicitud de inicio de recarga.

**Campos**:
- `amount` (number): Monto a recargar en pesos
  - Validaciones: `@IsNumber()`, `@IsPositive()`, `@Min(1000)`

## 2. WompiPaymentDataDto
**Ubicación**: `src/payments/dto/wompi-payment-data.dto.ts`

**Propósito**: Tipo de respuesta para datos de pago Wompi.

**Campos**:
- `reference` (string): Referencia única del pago
- `amountInCents` (number): Monto en centavos
- `currency` (string): Moneda (COP)
- `signature` (string): Firma SHA256 de integridad
- `publicKey?` (string): Llave pública de Wompi (opcional)

## 3. WompiWebhookDto
**Ubicación**: `src/payments/dto/wompi-webhook.dto.ts`

**Propósito**: Validar estructura de webhooks entrantes de Wompi.

**Estructura**:
```typescript
{
  event: string,
  data: {
    transaction: {
      id: string,
      reference: string,
      status: string,
      amount_in_cents: number,
      currency?: string
    },
    checksum?: string
  }
}
```

**Validaciones**: `@IsString()`, `@IsNotEmpty()`, `@ValidateNested()`, `@Type()`

## Uso

### En CreditsController
```typescript
@Post('recharge/init')
initRecharge(@Body() dto: InitiateRechargeDto): Promise<WompiPaymentDataDto>
```

### En PaymentsController
```typescript
@Post('wompi/webhook')
handleWompiWebhook(@Body() event: WompiWebhookDto)
```

## Beneficios

1. ✅ **Validación automática**: NestJS valida automáticamente la entrada antes de llegar al handler.
2. ✅ **Documentación Swagger**: Los DTOs generan documentación automática en /api.
3. ✅ **Type Safety**: TypeScript valida tipos en tiempo de compilación.
4. ✅ **Mensajes claros**: Errores de validación con mensajes descriptivos.
