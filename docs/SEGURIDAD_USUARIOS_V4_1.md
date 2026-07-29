# ROY Enterprise 4.1 - Usuarios y seguridad

- El rol Personalizado permite marcar permisos uno por uno.
- Solo el propietario puede otorgar el rol Administrador, el permiso Usuarios o Control total.
- Los demás administradores solo pueden gestionar usuarios operativos.
- No se permite modificar o desactivar la propia cuenta desde el panel.
- Cada creación, edición, cambio de rol, cambio de permisos, activación, desactivación y eliminación genera un registro inmutable en `roy_user_audit`.
- El historial muestra quién realizó el cambio, a qué usuario, cuándo, el motivo y las diferencias.
- Las reglas de Firestore aplican permisos reales por colección; ocultar un menú ya no es la única protección.

## Importante
Publica el archivo `firestore.rules` de esta versión. Esta actualización sí requiere actualizar las reglas para activar la seguridad por rol y el historial.
