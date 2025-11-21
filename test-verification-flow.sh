#!/bin/bash

# Script para probar el flujo completo de registro y verificación

echo "=== PRUEBA DE FLUJO DE REGISTRO Y VERIFICACIÓN ==="
echo ""

# 1. Registrar usuario
echo "1. Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Verification","email":"verify@test.com","password":"password123"}')

echo "Respuesta: $REGISTER_RESPONSE"
echo ""

# 2. Esperar un momento para que se procese
sleep 2

# 3. Obtener código de verificación de la base de datos
echo "2. Obteniendo código de verificación..."
# Nota: En producción, el usuario recibiría esto por email
# Aquí lo obtenemos directamente de la BD para testing

echo "   (El código se envió por email a verify@test.com)"
echo "   Para testing, consulta la base de datos o revisa los logs del email"
echo ""

# 4. Simular verificación con código (reemplazar XXXXXX con el código real)
echo "3. Para verificar, usa:"
echo "   curl -X POST http://localhost:3000/api/v1/auth/verify-email \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -D '{\"code\":\"CODIGO_AQUI\"}'"
echo ""

echo "4. Verificar créditos después de la verificación:"
echo "   SELECT email, credits, email_verified FROM users WHERE email = 'verify@test.com';"
echo ""

echo "=== FIN DE LA PRUEBA ==="
