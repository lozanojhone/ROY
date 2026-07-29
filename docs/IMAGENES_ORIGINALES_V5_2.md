# ROY Enterprise 5.2 - Imágenes originales sin pantalla blanca

## Corrección aplicada

- La tienda ya no utiliza la miniatura comprimida como fotografía visible del producto.
- Se recupera `data`, que corresponde a la imagen principal original optimizada, desde `roy_product_images`.
- Mientras llega la fotografía se muestra un cargador oscuro de ROY, nunca un rectángulo blanco.
- Cuando el administrador ingresa, las imágenes originales antiguas se migran al documento del producto para acelerar las visitas posteriores.
- Los productos nuevos guardan la imagen original optimizada en `image` y conservan `imageThumb` únicamente como dato auxiliar interno.
- La ficha del producto espera la imagen original antes de mostrar la galería.
- Las galerías generales y por color siguen usando sus imágenes originales optimizadas.

## Publicación

Reemplaza todos los archivos de la versión anterior. Después realiza una recarga forzada o elimina los datos del sitio para retirar el service worker anterior.
