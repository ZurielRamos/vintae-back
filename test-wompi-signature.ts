/**
 * Script de test para verificar la firma de Wompi
 * Ejecutar con: npx ts-node test-wompi-signature.ts
 */
import * as crypto from 'crypto';

// REEMPLAZA ESTOS VALORES CON LOS TUYOS
const REFERENCE = 'PACKAGE-MEDIUM-c7446adb-8f87-4dd5-bd42-cc896c3469b5-1763960491624';
const AMOUNT_IN_CENTS = 6990000;
const CURRENCY = 'COP';
const INTEGRITY_SECRET = 'prod_integrity_vUWgEyFrR58qrVKiDe1lrJdDTtnokMs7'; // Cópialo exactamente desde Wompi

// Generar firma
const amountStr = String(AMOUNT_IN_CENTS);
const chain = `${REFERENCE}${amountStr}${CURRENCY}${INTEGRITY_SECRET}`;
const signature = crypto.createHash('sha256').update(chain).digest('hex');

console.log('='.repeat(60));
console.log('WOMPI SIGNATURE TEST');
console.log('='.repeat(60));
console.log('Reference:', REFERENCE);
console.log('Amount:', amountStr);
console.log('Currency:', CURRENCY);
console.log('Integrity Secret:', INTEGRITY_SECRET.substring(0, 20) + '...');
console.log('-'.repeat(60));
console.log('String a hashear:', chain.substring(0, 100) + '...');
console.log('Signature generada:', signature);
console.log('='.repeat(60));

// Verificación con Wompi
console.log('\n📋 PASOS PARA VERIFICAR:');
console.log('1. Ve a https://docs.wompi.co/docs/widgets-checkout-web');
console.log('2. Usa esta información en el widget de Wompi:');
console.log('   - Reference:', REFERENCE);
console.log('   - Amount (cents):', AMOUNT_IN_CENTS);
console.log('   - Currency:', CURRENCY);
console.log('   - Public Key: (tu pub_prod_xxx)');
console.log('   - Signature:', signature);
console.log('\n3. Si sigue fallando, verifica que tu INTEGRITY_SECRET sea correcto');
