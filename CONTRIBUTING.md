# Contribuir a Super Milei Bros

¡Gracias por ayudar a mejorar el juego! Se aceptan correcciones, niveles, personajes, accesibilidad, arte, sonido y documentación. El proyecto es una sátira independiente; mantené ese tono y evitá presentar escenas ficticias como hechos o citas literales.

## Antes de empezar

- Para un bug, abrí un issue con pasos para reproducirlo, navegador, sistema operativo y, si afecta la interfaz, una captura o video.
- Para un personaje, nivel o cambio grande de jugabilidad, abrí primero un issue con la idea y su alcance. Así podemos acordar el diseño antes de producir assets.
- No incluyas secretos, datos personales ni credenciales en issues, commits o pull requests.

## Desarrollo local

Necesitás un navegador moderno y Node.js para los tests. No hay instalación de paquetes ni paso de compilación.

```sh
git clone https://github.com/lucasgday/super-milei-bros.git
cd super-milei-bros
python3 -m http.server 8000
```

Abrí `http://localhost:8000/`. También podés abrir `index.html` directamente, pero el ranking compartido requiere el despliegue con su backend y Redis; no pongas credenciales de Redis en el cliente.

El juego está en `game.js`, la interfaz en `index.html` y `style.css`, los recursos en `assets/`, y el ranking en `api/leaderboard.js`. Sus pruebas están en `test/leaderboard.test.js`.

## Antes de enviar un PR

1. Hacé un fork, creá una rama para tu cambio y mantené el PR enfocado en una sola mejora.
2. Corré `node --check game.js` y `node --test test/leaderboard.test.js`. Si tocaste otros archivos JavaScript, comprobá también su sintaxis.
3. Probá manualmente el flujo afectado en escritorio y, si cambiaste controles o diseño, en móvil vertical y apaisado. Incluí capturas de los cambios visuales en el PR.
4. Explicá qué cambiaste, cómo lo probaste y qué quedó sin verificar.

## Arte, audio y textos

Usá material propio o con permiso/licencia compatible con su publicación en este repositorio. Para cada recurso nuevo, documentá en el README su autor, fuente, licencia y cualquier transformación. No asumas que la licencia MIT del código cubre automáticamente los assets ni que una canción o grabación es libre por circular en internet. No subas canciones comerciales, voces clonadas de personas reales ni material de procedencia incierta.

Si incorporás una cita atribuida a una persona real, enlazá una fuente verificable y distinguí la cita de la ficción y la paráfrasis. Los personajes reales deben seguir siendo caricaturas claramente satíricas, sin confundir el juego con un producto oficial.

## Convivencia

La sátira política puede ser filosa; los aportes y las discusiones entre colaboradores deben ser respetuosos. Criticá ideas y decisiones del juego, no ataques personalmente a quienes participan.
