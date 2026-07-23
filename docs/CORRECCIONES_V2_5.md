# ROY Enterprise 2.5

## Usuarios y roles
- El panel consulta directamente la colección `roy_users` cada vez que se abre Usuarios.
- Normaliza campos antiguos (`rol`, `username`, permisos como texto).
- Elimina duplicados visuales por correo.
- Confirma el rol devuelto por Firestore después de guardar.
- Incluye el botón **Actualizar usuarios y roles**.
- Muestra mensajes explícitos de éxito o error.

## Videos móviles
- Reproductor 16:9 compacto en celulares.
- Reproducción automática silenciada para cumplir las políticas del navegador.
- `playsinline`, sin deformación y con carga inmediata.
- YouTube, Vimeo, TikTok y Facebook reciben parámetros de autoplay cuando la plataforma lo permite.

## Publicación
Sube toda la carpeta y actualiza con Ctrl+F5. En celular, borra los datos del sitio una vez si continúa apareciendo la versión anterior.
