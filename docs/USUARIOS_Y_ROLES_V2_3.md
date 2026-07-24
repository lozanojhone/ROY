# Usuarios y roles ROY 2.3

- Crear usuario con correo y contraseña temporal.
- Asignar rol predefinido o permisos personalizados.
- Editar rol y permisos.
- Activar o desactivar acceso.
- Enviar recuperación de contraseña.
- Eliminar el acceso del sistema.

La eliminación desde el navegador quita el documento de permisos en Firestore. La cuenta de Firebase Authentication permanece por seguridad; al no tener documento activo, no puede acceder al panel. Para borrar físicamente esa cuenta de Authentication se requiere Firebase Admin SDK desde un servidor seguro.
