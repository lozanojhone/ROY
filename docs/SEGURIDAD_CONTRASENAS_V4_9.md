# ROY Enterprise 4.9 - Seguridad de contraseñas

## Funciones añadidas
- Cambio de contraseña del usuario conectado con reautenticación de la contraseña actual.
- Reglas mínimas: 12 caracteres, mayúscula, minúscula, número y símbolo.
- Confirmación doble de la nueva contraseña.
- Cierre de la sesión actual después del cambio.
- Enlace de recuperación para la cuenta conectada.
- Envío de recuperación a usuarios desde Usuarios y seguridad.
- Registro de PASSWORD_CHANGE y PASSWORD_RESET_SENT en roy_user_audit.
- Las contraseñas nunca se guardan en Firestore.

## Firebase
Publicar el archivo firestore.rules incluido para permitir los nuevos eventos de auditoría.
