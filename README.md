# Super Milei Bros

Un fan game satírico de plataformas, jugable en el navegador y de código abierto. Javier y Karina atraviesan Buenos Aires en La avenida, que termina con Cristina como jefa intermedia y desbloquea a Patricia. Después viajan a Córdoba en La economía para enfrentar a la inflación. Hay grupos de piqueteros (cada multitud cuenta como un solo enemigo), ñoquis y billetes de inflación. El enfrentamiento con La Casta queda para futuras versiones.

## Jugar

[Jugar online](https://super-milei-bros.vercel.app/)

Abrí `index.html` en un navegador moderno. También podés servir la carpeta con `npx serve .` o `python3 -m http.server 8000`.

| Acción | Teclado |
| --- | --- |
| Moverse | A / D o flechas |
| Saltar | Espacio, W o flecha arriba |
| Atacar | J |
| Habilidad especial | K |
| Cambiar Javier / Karina | Q |
| Pausar | P |

En móvil, usá las flechas de la izquierda para moverte y los botones de la derecha para atacar, saltar, usar el poder y cambiar de personaje. Los controles transparentes flotan sobre el escenario tanto en vertical como en horizontal y admiten dos dedos a la vez. También siguen disponibles los gestos sobre el escenario: mantener pulsada la mitad izquierda para moverse; tocar la mitad derecha para saltar, deslizar a los lados para atacar, hacia arriba para la habilidad o hacia abajo para cambiar. En horizontal, la pausa queda superpuesta arriba al centro y el control de música se oculta para dejar más espacio.

Conan corre cuando te acercás: hay que alcanzarlo para ganar su bonus. Cristina dispara de a un proyectil más lento y espaciado, dirigido a la posición del personaje al disparar, también cuando está en el suelo; se puede esquivar moviéndose o saltando.

Cada nivel tiene una introducción narrativa antes de empezar y un cierre al llegar a la meta. Tras derrotar a Cristina, su sprite queda detrás de rejas como parte de la ficción satírica del juego. El botón GUARDAR PUNTAJE del cierre abre el formulario de alias y el ranking.

Al tocar JUGAR en móvil, el juego solicita pantalla completa cuando el navegador la admite; el botón ⛶ permite volver a activarla o salir. Si el navegador no ofrece esa API, agregá el sitio a la pantalla de inicio y abrilo desde su ícono para jugar sin la barra de direcciones.

## Desarrollo

No hay dependencias ni compilación. El juego está hecho con Canvas 2D, JavaScript y CSS. Los fondos y objetos se dibujan en `game.js`; los sprites están en `assets/`. Cada personaje jugable tiene una tira animada de cuatro cuadros (quieto, dos de carrera y ataque), declarada en `heroes` mediante `sprite`; ese formato también se usará para los próximos personajes. La música se reproduce al empezar la partida y se puede silenciar desde el botón superior. La mayoría de los efectos se sintetizan con Web Audio; la risa y el rugido usan muestras de audio acreditadas abajo.

`assets/buenos-aires-landmarks.png` es un sprite transparente generado con la herramienta integrada de OpenAI a partir de esta consigna: «Tres fachadas reconocibles de Buenos Aires, Obelisco, Casa Rosada y Teatro Colón, separadas en una tira, pixel art de plataformas, elevaciones frontales y fondo transparente». Se usa como escenografía raster en el nivel 1-1, por encima de los edificios genéricos y detrás de personajes y objetos.

Los textos narrativos son paráfrasis y ficción, no transcripciones literales salvo la cita breve atribuida en el cierre del nivel 1-1. Fuentes: [discurso en el Cabildo de Córdoba (2024)](https://www.casarosada.gob.ar/informacion/discursos/50514-cadena-nacional-del-presidente-de-la-nacion-javier-milei-en-el-dia-de-la-conmemoracion-del-aniversario-numero-214-de-la-revolucion-de-mayo-en-el-cabildo-de-cordoba), [discurso en el IERAL (2024)](https://www.casarosada.gob.ar/informacion/discursos/50748-palabras-del-presidente-de-la-nacion-javier-milei-en-el-ieral-desde-la-provincia-de-cordoba) y [apertura del Congreso (2026)](https://www.casarosada.gob.ar/slider-principal/51181-discurso-del-presidente-de-la-nacion-javier-milei-en-la-apertura-del-144-periodo-de-sesiones-ordinarias-del-congreso-de-la-nacion).

El botón COMPARTIR usa la hoja nativa del móvil o copia un enlace en escritorio. El ranking compartido funciona al desplegar en Vercel y conectar Upstash Redis con las variables de servidor `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL` y `KV_REST_API_TOKEN` de la integración Vercel); al abrir `index.html` directamente, el ranking muestra que no está disponible. Hay tablas separadas para los niveles 1-1 y 1-2. Al terminar una partida se puede publicar un alias y el puntaje. Es un ranking amistoso: el juego se ejecuta en el cliente y los puntajes no tienen verificación contra trampas. La API limita envíos por dirección de red, sin guardar la dirección en texto plano.

La banda sonora toma como referencia el rock guitarrero, el new wave y las marchas de la cultura política argentina, sin usar grabaciones, melodías ni arreglos de las canciones mencionadas. Cambia de pista sin superponerlas al acercarse a una multitud o avanzar por el nivel; el combate con Cristina abre con una marcha breve y continúa con rock más pesado. Las licencias de los audios son independientes de la licencia MIT del código:

- `assets/avenida-rock.mp3`: [Rock Theme Song (loop)](https://opengameart.org/content/rock-theme-song), Umplix, CC0; convertido de WAV a MP3 para la web.
- `assets/ciudad-new-wave.mp3`: [The Way It Is](https://opengameart.org/content/the-way-it-is), Zane Little Music, CC0; recomprimido para la web.
- `assets/crowd-rock.mp3`: [Ghosts & Heroes (2025 remaster)](https://opengameart.org/content/ghosts-heroes), Bobjt, CC0.
- `assets/boss-march.mp3`: [March Two-Step](https://opengameart.org/content/march-two-step), tcarisland, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); fragmento de ocho segundos convertido a MP3 para la entrada del jefe.
- `assets/boss-battle.mp3`: [Boss Battle 10 Metal](https://opengameart.org/content/boss-battle-10-metal), nene, CC0; convertido de WAV a MP3 para la web.
- `assets/lion-roar.mp3`: [Lion raring-sound1TamilNadu178.ogg](https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg), Info-farmer, dominio público; fragmento ecualizado y normalizado.
- `assets/javier-laugh.mp3`: [Do you remember laughter?](https://opengameart.org/content/do-you-remember-laughter), Supergeek, CC0; fragmento ecualizado y normalizado. Es una risa satírica, no una grabación de Javier Milei.

## Licencia

Código disponible bajo la licencia MIT. Este proyecto es una sátira independiente y no tiene afiliación oficial con las personas representadas.
