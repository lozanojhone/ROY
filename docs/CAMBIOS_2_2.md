# ROY Enterprise 2.2

- Envío gratuito en todos los pedidos: recojo y domicilio muestran S/ 0.00.
- Registro de usuarios corregido: crea cuenta en Firebase Authentication, guarda el rol en `roy_users/{uid}` y verifica el documento.
- Reglas de Firestore reforzadas para reconocer al propietario por UID.
- Videos embebidos para YouTube, Vimeo, TikTok, Instagram, Facebook y enlaces directos MP4/WebM/OGG.
- Caché actualizado a 2.2 para evitar que el navegador siga usando scripts antiguos.

Después de publicar, reemplaza las reglas de Firestore por `firestore.rules` y realiza Ctrl + F5.
