# ROY Enterprise 4.6 — corrección de congelamiento en Usuarios

- La pestaña Usuarios abre de inmediato sin esperar consultas de Firebase.
- Se evita ejecutar varias cadenas duplicadas de navegación, renderizado e historial.
- Los usuarios guardados se muestran primero y la sincronización ocurre en segundo plano.
- El historial ya no se descarga automáticamente al abrir la pestaña; se carga al pulsar “Actualizar historial”.
- Los botones de actualización bloquean dobles clics mientras una consulta está en curso.
- Se retiró un observador global del DOM que generaba trabajo innecesario.
- Se mantienen roles personalizados, permisos, historial y cambio de contraseña.
