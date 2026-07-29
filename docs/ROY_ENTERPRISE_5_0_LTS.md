# ROY Enterprise 5.0 LTS

## Seguridad
- Las contraseñas se administran exclusivamente con Firebase Authentication.
- El dueño y cada usuario pueden cambiar su propia contraseña validando primero la actual.
- El administrador puede enviar recuperación de contraseña, pero nunca ver contraseñas privadas.
- Los cambios de roles, permisos y recuperación quedan registrados en el historial.

## Fotografías
- Se mantiene la proporción original de cada fotografía.
- No se recorta, estira ni deforma la prenda.
- Las tarjetas y la ficha usan `object-fit: contain`.
- La imagen completa se optimiza hasta 1600 px con calidad alta.
- La miniatura se genera hasta 600 px con calidad alta para carga rápida.
- El fondo neutro completa el espacio cuando la foto no coincide con el formato de la tarjeta.
