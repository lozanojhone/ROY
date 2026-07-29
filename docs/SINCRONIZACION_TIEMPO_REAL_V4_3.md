# ROY Enterprise 4.3 - Catalogo en tiempo real

## Correccion principal
La tienda escucha directamente los cambios de Firebase mediante `onSnapshot`.

Cuando un administrador crea, modifica o elimina un producto:

- la tienda abierta en otros navegadores se actualiza sin recargar;
- si se elimina el ultimo producto, el catalogo queda vacio en todos los equipos;
- la copia local ya no puede mantener productos eliminados mientras Firebase esta conectado;
- categorias, promociones, galeria y configuracion publica tambien se sincronizan.

## Navegacion
No se modifico la proteccion de navegacion existente. Al usar el boton o gesto para salir de una seccion, la tienda continua regresando primero a Inicio.

## Firebase
No se necesita crear una base de datos nueva. Deben mantenerse publicadas las reglas de Firestore de la version 4.1/4.2.
