/**
 * Test con claves de SANDBOX/TEST de Wompi
 */
import * as crypto from 'crypto';

// Usa las claves de TEST de tu cuenta
const REFERENCE = 'TEST-' + Date.now();
const AMOUNT_IN_CENTS = 6990000;
const CURRENCY = 'COP';
const INTEGRITY_SECRET = 'test_integrity_eeaVSHusSewFKUJ1QN9nuBb2SHpzmRKt'; // Cámbialo por tu test_integrity_xxx
const PUBLIC_KEY = 'pub_test_IfBQW5TBJ5InXqu0ZmdhJ9wq0I1G26w0'; // Cámbialo por tu pub_test_xxx

const amountStr = String(AMOUNT_IN_CENTS);
const chain = `${REFERENCE}${amountStr}${CURRENCY}${INTEGRITY_SECRET}`;
const signature = crypto.createHash('sha256').update(chain).digest('hex');

console.log('\n🧪 PRUEBA CON CLAVES DE TEST/SANDBOX\n');
console.log('Usa estos datos en: https://checkout.wompi.co/l (modo sandbox)');
console.log('=====================================');
console.log('Public Key:', PUBLIC_KEY);
console.log('Reference:', REFERENCE);
console.log('Amount (cents):', AMOUNT_IN_CENTS);
console.log('Currency:', CURRENCY);
console.log('Signature:', signature);
console.log('=====================================\n');
