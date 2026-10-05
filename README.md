# Super Milei Bros

Un fan game satírico de plataformas, jugable en el navegador y de código abierto. Javier y Karina atraviesan un primer nivel con grupos de piqueteros (cada multitud cuenta como un solo enemigo), ñoquis, billetes de inflación y Cristina como jefa intermedia. Al completarlo se desbloquea Patricia para volver a jugar. Más niveles, aliados y el enfrentamiento con La Casta quedan para futuras versiones.

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

En móvil se juega directamente sobre el escenario, preferentemente en horizontal. Mantené un dedo en el primer cuarto de la pantalla para ir a la izquierda o en el segundo cuarto para ir a la derecha; podés deslizarlo entre ambos. Con otro dedo, en la mitad derecha: tocá para saltar, deslizá a los lados para atacar, hacia arriba para la habilidad especial o hacia abajo para cambiar de personaje. El botón de pausa queda arriba a la derecha.

## Desarrollo

No hay dependencias ni compilación. El juego está hecho con Canvas 2D, JavaScript y CSS. Los fondos y objetos se dibujan en `game.js`; los sprites están en `assets/`. La música se reproduce al empezar la partida y se puede silenciar desde el botón superior. Los efectos de sonido se sintetizan en el navegador con Web Audio.

La banda sonora tiene cuatro pistas de rock/punk con licencia CC0, no versiones ni arreglos de canciones existentes. La música cambia con un fundido al acercarse a una multitud, avanzar a la segunda mitad del nivel o entrar en el combate con Cristina:

- `assets/unchained-destiny.mp3`: [Unchained Destiny (loop)](https://opengameart.org/content/unchained-destiny-rock), nene, CC0; convertido de WAV a MP3 para la web.
- `assets/crowd-rock.mp3`: [Ghosts & Heroes (2025 remaster)](https://opengameart.org/content/ghosts-heroes), Bobjt, CC0.
- `assets/flesh-and-blood.mp3`: [Flesh and Blood](https://opengameart.org/content/punk-hardcore), Alex McCulloch (Pro Sensory), CC0.
- `assets/boss-battle.mp3`: [Boss Battle 10 Metal](https://opengameart.org/content/boss-battle-10-metal), nene, CC0; convertido de WAV a MP3 para la web.

## Licencia

Código disponible bajo la licencia MIT. Este proyecto es una sátira independiente y no tiene afiliación oficial con las personas representadas.
