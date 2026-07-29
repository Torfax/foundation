# app-coupled (fuera del paquete)

Estos archivos provienen del `src/core` original (proyecto `aloja-api`) pero están
**acoplados a esa aplicación**: importan módulos o entidades específicos del proyecto
de origen. **No forman parte del build de `@torfax/foundation`** (el `tsconfig` solo
compila `src/` y excluye esta carpeta).

Se conservan aquí como referencia mientras se decide si:

- se generalizan y vuelven al paquete, o
- se eliminan por pertenecer al proyecto consumidor.

## Contenido

- `config/AppConfigBootstrap.ts` — Valida un esquema de entorno concreto
  (Payway, SMTP, JWT…) e importa el módulo de email de la app (`@src/modules/email`).
  Es configuración de la aplicación consumidora, no del foundation.
- `AppCore.ts` — Composition root de la *aplicación*: ensambla `ConfigService` y
  `FilesModule` para un host concreto. En el nuevo modelo, ensamblar es
  responsabilidad del host (o de su bridge Nest), no del paquete.
