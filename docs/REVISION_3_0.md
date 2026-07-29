# ROY Enterprise 3.0

- Logo oficial predeterminado: símbolo verde neón y palabra ROY blanca.
- Marca y colores editables desde Configuración y aplicados globalmente.
- Usuarios leídos directamente desde `roy_users`.
- Crear/editar roles, activar, deshabilitar y eliminar acceso con verificación Firestore.
- Se eliminaron módulos de usuarios duplicados que producían conflictos.
- Productos, galería, categorías, promociones, pedidos, pagos, mensajes, opiniones, inventario, envíos y configuración usan persistencia Firebase + caché local.
- Imágenes y videos de galería conservan proporción 4:5 sin deformación.
- Compatible con plan gratuito: imágenes comprimidas en Firestore, sin dependencia obligatoria de Storage.
