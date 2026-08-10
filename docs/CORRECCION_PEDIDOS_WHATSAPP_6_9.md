# ROY 6.9 - Pedidos, clientes y ventas

- El botón Finalizar compra abre WhatsApp inmediatamente mediante wa.me.
- El pedido se guarda en roy_orders sin bloquear la apertura de WhatsApp.
- Si Firebase o la red fallan, el pedido queda en una cola local y se reintenta automáticamente.
- El panel administrativo recibe pedidos en tiempo real.
- Clientes y Ventas se calculan automáticamente desde los pedidos guardados.
- El pedido incluye DNI, celular, entrega, dirección, referencia, cupón, subtotal, descuento y total.
