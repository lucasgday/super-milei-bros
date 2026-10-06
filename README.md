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

En móvil, usá las flechas de la izquierda para moverte y los botones de la derecha para atacar, saltar, usar el poder y cambiar de personaje. Los controles quedan debajo del escenario tanto en vertical como en horizontal y admiten dos dedos a la vez. También siguen disponibles los gestos sobre el escenario: mantener pulsada la mitad izquierda para moverse; tocar la mitad derecha para saltar, deslizar a los lados para atacar, hacia arriba para la habilidad o hacia abajo para cambiar. La pausa queda arriba a la derecha.

## Desarrollo

No hay dependencias ni compilación. El juego está hecho con Canvas 2D, JavaScript y CSS. Los fondos y objetos se dibujan en `game.js`; los sprites están en `assets/`. Cada personaje jugable tiene una tira animada de cuatro cuadros (quieto, dos de carrera y ataque), declarada en `heroes` mediante `sprite`; ese formato también se usará para los próximos personajes. La música se reproduce al empezar la partida y se puede silenciar desde el botón superior. Los efectos de sonido se sintetizan en el navegador con Web Audio.

La banda sonora toma como referencia el rock guitarrero, el new wave y las marchas de la cultura política argentina, sin usar grabaciones, melodías ni arreglos de las canciones mencionadas. Cambia con un fundido al acercarse a una multitud o avanzar por el nivel; el combate con Cristina abre con una marcha breve y continúa con rock más pesado. Las licencias de los audios son independientes de la licencia MIT del código:

- `assets/avenida-rock.mp3`: [Rock Theme Song (loop)](https://opengameart.org/content/rock-theme-song), Umplix, CC0; convertido de WAV a MP3 para la web.
- `assets/ciudad-new-wave.mp3`: [The Way It Is](https://opengameart.org/content/the-way-it-is), Zane Little Music, CC0; recomprimido para la web.
- `assets/crowd-rock.mp3`: [Ghosts & Heroes (2025 remaster)](https://opengameart.org/content/ghosts-heroes), Bobjt, CC0.
- `assets/boss-march.mp3`: [March Two-Step](https://opengameart.org/content/march-two-step), tcarisland, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); fragmento de ocho segundos convertido a MP3 para la entrada del jefe.
- `assets/boss-battle.mp3`: [Boss Battle 10 Metal](https://opengameart.org/content/boss-battle-10-metal), nene, CC0; convertido de WAV a MP3 para la web.

## Licencia

Código disponible bajo la licencia MIT. Este proyecto es una sátira independiente y no tiene afiliación oficial con las personas representadas.
