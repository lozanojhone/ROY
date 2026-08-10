# ROY Enterprise 2.0

## Publicación rápida
1. Publica `firestore.rules` en Firebase > Firestore > Normas.
2. Sube toda la carpeta a tu alojamiento, conservando `css`, `js` y `assets`.
3. Para Firebase Hosting, instala Firebase CLI y ejecuta `firebase deploy` desde esta carpeta.
4. Abre `index.html` para la tienda y `admin.html` para el panel.

## Importante
- El sistema está optimizado para Firestore en el plan gratuito y no requiere Cloud Storage.
- Las imágenes se comprimen antes de guardarse. Evita cargar demasiadas imágenes grandes por producto para no alcanzar los límites de Firestore.
- Cambia `TU-DOMINIO` en `sitemap.xml` cuando tengas el dominio definitivo.
