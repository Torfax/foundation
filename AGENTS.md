# Entrada para agentes

Antes de trabajar en este repo, leer
[`torfax-platform/docs/ecosistema.md`](../torfax-platform/docs/ecosistema.md), el
[`README.md`](README.md) y [`torfax-dev/AGENTS.md`](../torfax-dev/AGENTS.md).

Foundation no contiene dominio Torfax. Su núcleo (`src/`, salvo `src/nest/`) no depende de Nest
ni de ningún framework; `src/nest/` (`@torfax/foundation/nest`) lo conecta a Nest, depende del
núcleo y tiene a Nest como dependencia opcional. Si algo nombra un token de Torfax, una
instalación o una acción, no va acá: va en el SDK (`torfax-node`). Después de modificarla, correr `npm test`
y construirla antes de validar Platform, Arcana o Desktop, que la consumen mediante `file:`.
