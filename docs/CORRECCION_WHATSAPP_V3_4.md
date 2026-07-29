# ROY Enterprise 3.4 - Corrección de WhatsApp

- Se corrigió el bloqueo de la pestaña de WhatsApp en Chrome, Edge y navegadores de escritorio.
- La pestaña se reserva inmediatamente al pulsar el botón, antes de los guardados asíncronos de Firebase.
- El pedido continúa guardándose en Firestore antes de redirigir.
- Si el navegador bloquea la pestaña, se utiliza redirección en la pestaña actual como respaldo.
- Se bloquean dobles clics mientras el pedido se registra.
- Se muestra un estado visible de registro.
