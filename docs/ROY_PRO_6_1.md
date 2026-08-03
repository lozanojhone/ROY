# ROY Enterprise PRO 6.1

## Cambios incluidos
- Checkout y carrito visualmente compactos para PC y celulares.
- Validación visible junto a cada campo.
- DNI y referencia opcional incorporados al pedido y al mensaje de WhatsApp.
- Aviso “Producto agregado” limitado a 1.8 segundos.
- Analítica anónima: sesión, vista de producto, agregado al carrito y checkout.
- Alertas de pedidos nuevos para administradores con el panel abierto.
- Inventario inteligente con productos agotados o con cinco unidades o menos.
- Respaldo automático local diario y descarga manual en JSON.

## Límites importantes
- Las notificaciones funcionan cuando el panel está abierto. Notificaciones con la aplicación cerrada requieren Firebase Cloud Messaging y un backend.
- El respaldo automático se guarda en el navegador. Una copia cloud programada requiere Cloud Functions/Cloud Scheduler o un servidor.
- Yape/Plin mediante QR no confirman pagos automáticamente. Para confirmación real se requiere una pasarela con API y webhook, como Mercado Pago, Culqi, Izipay o Stripe.
- La preparación para 5 000 productos o 100 000 clientes requiere paginación por consultas, índices, almacenamiento de imágenes optimizado y backend; esta versión deja módulos separados, pero no afirma esa capacidad sin pruebas de carga.
