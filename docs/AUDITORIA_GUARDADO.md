# Auditoria de guardado ROY Enterprise 2.1

## Error encontrado
`06-roy-v21-script.js` deshabilitaba el boton Guardar antes de llamar a la funcion V20. La funcion V20 comienza comprobando `if (btn.disabled) return`, por lo que finalizaba sin guardar.

## Correccion
La capa V21 ya no deshabilita el boton. El guardado V20 controla por si mismo el bloqueo, progreso, validacion, escritura de imagenes y escritura del producto.

## Flujo actual
1. Valida sesion, nombre, categoria, precio, stock e imagen principal.
2. Comprime las imagenes.
3. Guarda cada imagen en `roy_product_images`.
4. Guarda el producto en `roy_products`.
5. Verifica que el documento exista.
6. Recarga el catalogo y muestra confirmacion.
