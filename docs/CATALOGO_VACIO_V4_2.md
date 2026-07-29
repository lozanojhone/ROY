# ROY Enterprise 4.2 - Catálogo vacío real

## Corrección principal

- Se retiraron todos los productos de demostración del código.
- La aplicación elimina de forma segura los productos demostrativos heredados de versiones anteriores.
- Si `roy_products` está vacío en Firebase, la tienda se muestra vacía y no recupera productos ficticios desde el navegador.
- Si Firebase no está disponible, se conserva únicamente la copia local real del negocio.
- Inicio, Tienda y SALE muestran mensajes claros cuando no existen productos.

## Firebase

No se requiere cambiar las reglas. Solo debes reemplazar los archivos del sistema y actualizar la caché del navegador.
