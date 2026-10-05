# Super Milei Bros

Un fan game satírico de plataformas, jugable en el navegador y de código abierto. Javier y Karina atraviesan un primer nivel con piqueteros, ñoquis, billetes de inflación y Cristina como jefa intermedia. Al completarlo se desbloquea Patricia para volver a jugar. Más niveles, aliados y el enfrentamiento con La Casta quedan para futuras versiones.

## Jugar

Abrí `index.html` en un navegador moderno. También podés servir la carpeta con `npx serve .` o `python3 -m http.server 8000`.

| Acción | Teclado |
| --- | --- |
| Moverse | A / D o flechas |
| Saltar | Espacio, W o flecha arriba |
| Atacar | J |
| Habilidad especial | K |
| Cambiar Javier / Karina | Q |
| Pausar | P |

En pantallas táctiles aparecen controles debajo del juego.

## Desarrollo

No hay dependencias ni compilación. El juego está hecho con Canvas 2D, JavaScript y CSS. Los fondos y objetos se dibujan en `game.js`; los sprites están en `assets/`. La música se reproduce al empezar la partida y se puede silenciar desde el botón superior. Los efectos de sonido se sintetizan en el navegador con Web Audio.

La banda sonora tiene dos pistas de rock/punk con licencia CC0, no versiones ni arreglos de canciones existentes:

- `assets/flesh-and-blood.mp3`: [Flesh and Blood](https://opengameart.org/content/punk-hardcore), Alex McCulloch (Pro Sensory), CC0.
- `assets/boss-battle.mp3`: [Boss Battle 10 Metal](https://opengameart.org/content/boss-battle-10-metal), nene, CC0; convertido de WAV a MP3 para la web.

## Licencia

Código disponible bajo la licencia MIT. Este proyecto es una sátira independiente y no tiene afiliación oficial con las personas representadas.
