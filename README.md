# Super Milei Bros

Un fan game satírico de plataformas, jugable en el navegador y de código abierto. Javier y Karina atraviesan Buenos Aires en La avenida, que termina con Cristina como jefa intermedia y desbloquea a Patricia. Después viajan a Córdoba en La economía para enfrentar a la inflación, y al Congreso en La casta para enfrentar al Déficit Fiscal. El mapa puede seguir creciendo con más capítulos. Hay grupos de piqueteros (cada multitud cuenta como un solo enemigo), ñoquis y billetes de inflación. En cada partida cambian algunos adversarios y aparecen, como caricaturas genéricas, narcos, periodistas ensobrados, econochantas, agoreros, progres, zurdos o sindigarcas.

## Jugar

[Jugar online](https://super-milei-bros.vercel.app/)

Abrí `index.html` en un navegador moderno. También podés servir la carpeta con `npx serve .` o `python3 -m http.server 8000`.

| Acción | Teclado |
| --- | --- |
| Moverse | A / D o flechas |
| Saltar | Espacio, W o flecha arriba |
| Atacar | J |
| Habilidad especial | K |
| Cambiar entre los dos elegidos | Q |
| Pausar | P |

En móvil, usá las flechas de la izquierda para moverte y los botones de la derecha para atacar, saltar, usar el poder y cambiar de personaje. Los controles transparentes flotan sobre el escenario tanto en vertical como en horizontal y admiten dos dedos a la vez. También siguen disponibles los gestos sobre el escenario: mantener pulsada la mitad izquierda para moverse; tocar la mitad derecha para saltar, deslizar a los lados para atacar, hacia arriba para la habilidad o hacia abajo para cambiar. En horizontal, la pausa queda superpuesta arriba al centro y el control de música se oculta para dejar más espacio.

Conan, Murray y Milton aparecen en Buenos Aires; Robert y Lucas, en Córdoba. Los mastines corren cuando te acercás: hay que alcanzarlos para ganar vida, puntos y una carga del ataque de la manada. La próxima habilidad especial (K o su botón táctil) libera a los perros contra enemigos cercanos. Cristina dispara de a un proyectil más lento y espaciado, dirigido a la posición del personaje al disparar, también cuando está en el suelo; se puede esquivar moviéndose o saltando.

Cada nivel tiene una introducción narrativa antes de empezar y un cierre al llegar a la meta. Tras derrotar a Cristina, su sprite queda detrás de rejas como parte de la ficción satírica del juego. El formulario de alias aparece directamente al terminar, sin tapar los botones de continuar y compartir.

En la introducción de cada nivel elegís dos personajes diferentes viendo sus retratos y armas: Javier usa motosierra, Karina lanza proyectiles, Patricia usa un taser, Toto una calculadora y Sturzenegger decretos. Uno queda activo y otro lo acompaña a la vista. Buenos Aires desbloquea a Patricia, Córdoba a Toto y Congreso a Sturzenegger; los desbloqueos persisten y no se vuelven a anunciar al repetir un nivel. Toto puede hacer un ajuste de cuentas de área y Sturzenegger despeja proyectiles y aturde enemigos cercanos. El taser de Patricia aturde adversarios y su habilidad especial es la embestida.

Al tocar JUGAR en móvil, el juego solicita pantalla completa cuando el navegador la admite; el botón ⛶ permite volver a activarla o salir. Si el navegador no ofrece esa API, agregá el sitio a la pantalla de inicio y abrilo desde su ícono para jugar sin la barra de direcciones.

## Desarrollo

No hay dependencias ni compilación. El juego está hecho con Canvas 2D, JavaScript y CSS. Los fondos y objetos se dibujan en `game.js`; los sprites están en `assets/`. Cada personaje jugable tiene una tira animada de cuatro cuadros (quieto, dos de carrera y ataque), declarada en `heroes` mediante `sprite`; ese formato también se usará para los próximos personajes. El navegador carga versiones PNG reducidas (`*-small.png`); los originales se conservan como fuente, y los assets específicos de Córdoba y Congreso se cargan al entrar en esos niveles. La música se reproduce al empezar la partida y se puede silenciar desde el botón superior. La mayoría de los efectos se sintetizan con Web Audio; la risa y el rugido usan muestras de audio acreditadas abajo.

`assets/buenos-aires-landmarks.png` es un sprite transparente generado con la herramienta integrada de OpenAI a partir de esta consigna: «Tres fachadas reconocibles de Buenos Aires, Obelisco, Casa Rosada y Teatro Colón, separadas en una tira, pixel art de plataformas, elevaciones frontales y fondo transparente». Se usa como escenografía raster en el nivel 1-1, por encima de los edificios genéricos y detrás de personajes y objetos.

`assets/cordoba-landmarks.png` es una lámina transparente generada con la herramienta integrada de OpenAI a partir de esta consigna: «Tres hitos reconocibles de Córdoba, Argentina: fachada del Cabildo con arcos y torre del reloj, Iglesia de los Capuchinos con torres neogóticas, y La Cañada con puente de piedra y árboles; tres escenas separadas en una fila, elevaciones frontales en estilo pixel art de plataformas, sin cielo, suelo, personas ni texto». Las referencias públicas de los lugares se pueden consultar en [Cabildo y Catedral, foto de dominio público](https://commons.wikimedia.org/wiki/File:Catedral_y_Cabildo_de_Cordoba.JPG), [Iglesia de los Capuchinos](https://commons.wikimedia.org/wiki/File:Iglesia_de_los_Capuchinos_Cordoba_Argentina.jpg) y [La Cañada](https://commons.wikimedia.org/wiki/File:La_Ca%C3%B1ada.jpg). Estas fotos no están incluidas en el repositorio: la lámina es una recreación generada, no una reproducción de esos archivos.

`assets/random-enemies.png` es una lámina de cuatro sprites generada con la herramienta integrada de OpenAI a partir de esta consigna: «Cuatro arquetipos ficticios y genéricos en una fila, narco, periodista ensobrado, econochanta y agorero del fracaso, separados y orientados a la izquierda, con siluetas expresivas en pixel art de plataformas y fondo transparente; sin nombres, logotipos ni personas identificables». Luego se editó la misma lámina para que el gráfico del econochanta apunte hacia abajo, manteniendo los otros personajes y el fondo transparente.

`assets/political-enemies.png` es otra lámina generada con la herramienta integrada de OpenAI a partir de esta consigna: «Tres adversarios políticos ficticios en una fila, progre con cartel, zurdo con abrigo rojo y sindigarca con megáfono; sprites completos orientados a la izquierda, pixel art detallado y fondo transparente; sin nombres, insignias ni personas reales». Progre aparece de forma fija en Buenos Aires; zurdo y sindigarca en Córdoba. Además, pueden salir en los puestos variables de cada partida.

`assets/schiaretti-cutout.png` es un cameo satírico no combatiente, generado con la herramienta integrada de OpenAI a partir de esta consigna: «Juan Schiaretti, exgobernador de Córdoba, caricatura pixel art de cuerpo entero, cabello gris y anteojos, traje oscuro y mano levantada, fondo transparente; sin otros personajes ni texto». Aparece junto al Cabildo en el fondo del nivel cordobés; su presencia no representa una alianza histórica ni una postura atribuida a él.

`assets/mastiffs.png` representa a Conan, Murray, Milton, Robert y Lucas como mastines ingleses de colores distinguibles, en una lámina transparente generada para el juego. No es una reproducción fotográfica de perros concretos. `assets/decision-enemies.png` reúne las caricaturas genéricas del periodista, el sobre y la crítica que aparecen como consecuencia de decisiones. `assets/casta-landmarks.png` representa el Congreso, una bóveda y un archivo burocrático; `assets/deficit-boss.png` representa al Déficit Fiscal como libro contable monstruoso. Son ilustraciones generadas para el capítulo 1-3.

`assets/toto-animated.png` y `assets/sturzenegger-animated.png` son caricaturas generadas para el juego, con cuatro poses cada una y versiones reducidas que se cargan sólo después de desbloquearlas. En el Congreso aparece un sindicalista **ficticio** que dispara un mortero de fantasía; no representa a una persona identificada ni le atribuye violencia real.

Los textos narrativos son paráfrasis y ficción, salvo las citas breves atribuidas. Fuentes: [discurso en el Cabildo de Córdoba (2024)](https://www.casarosada.gob.ar/informacion/discursos/50514-cadena-nacional-del-presidente-de-la-nacion-javier-milei-en-el-dia-de-la-conmemoracion-del-aniversario-numero-214-de-la-revolucion-de-mayo-en-el-cabildo-de-cordoba), [discurso en el IERAL (2024)](https://www.casarosada.gob.ar/informacion/discursos/50748-palabras-del-presidente-de-la-nacion-javier-milei-en-el-ieral-desde-la-provincia-de-cordoba), [presentación del Presupuesto en el Congreso (2024)](https://www.casarosada.gob.ar/informacion/discursos/50662-cadena-nacional-del-presidente-de-la-nacion-javier-milei-presentando-el-presupuesto-2025-en-el-congreso-de-la-nacion) y [apertura del Congreso (2026)](https://www.casarosada.gob.ar/slider-principal/51181-discurso-del-presidente-de-la-nacion-javier-milei-en-la-apertura-del-144-periodo-de-sesiones-ordinarias-del-congreso-de-la-nacion).

El botón COMPARTIR usa la hoja nativa del móvil o copia un enlace en escritorio. El ranking compartido funciona al desplegar en Vercel y conectar Upstash Redis con las variables de servidor `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL` y `KV_REST_API_TOKEN` de la integración Vercel); al abrir `index.html` directamente, el ranking muestra que no está disponible. El ranking ahora es global: muestra los mejores puntajes de los tres niveles, conserva los registros históricos por nivel y acumula los puntos al pasar de uno al siguiente en la misma partida. Los registros históricos no se pueden convertir en partidas acumuladas porque no hay cuentas de jugador. Al terminar una partida se puede publicar un alias y el puntaje. Es un ranking amistoso: el juego se ejecuta en el cliente y los puntajes no tienen verificación contra trampas ni identidad única por alias. La API limita envíos por dirección de red, sin guardar la dirección en texto plano.

El pie de página muestra visitantes únicos **aproximados de hoy**, en horario argentino, cuando Redis está disponible. `api/visitors.js` calcula un HMAC de IP, navegador y día y usa HyperLogLog con vencimiento de 48 horas; no guarda IP en claro ni instala cookies. Distintos dispositivos de una misma persona pueden contar por separado, y dispositivos que comparten red y navegador pueden contar como uno. Los bots pueden entrar en el total. [Vercel Web Analytics](https://vercel.com/docs/analytics) ya ofrece la métrica privada en su panel; este contador es sólo para mostrar una estimación pública. `VISITOR_HASH_SECRET` es opcional y debe ser un secreto de servidor independiente si se configura.

El botón IDEAS lleva a las propuestas debajo del juego en escritorio; en móvil abre una pantalla superpuesta. Las propuestas de `ideas.json` aparecen primero y los votos pagos confirmados se actualizan después. Se pueden apoyar propuestas y enviar otras nuevas sin usar GitHub; las enviadas por jugadores quedan privadas en la lista Redis `super-milei-bros:ideas:pending-v1` hasta que un mantenedor las revise y agregue las aceptadas al JSON. Para revisarlas, consultá esa lista con `LRANGE` en la consola de Redis; no publiques automáticamente su contenido. Los votos gratuitos históricos quedan en su clave anterior y no se mezclan con los pagos. Sin Redis, las ideas se pueden leer localmente, pero no votar ni enviar.

### Votos pagos con Mercado Pago

**Compatibilidad pendiente:** esta versión del servidor crea preferencias con `/checkout/preferences` y espera Webhooks del evento `payment`. El evento **Order (Mercado Pago)** de Checkout Pro con API de Orders usa `/v1/orders`, IDs de orden y otro formato de notificación: sus claves de firma no pueden conectarse sin adaptar y probar el flujo. No cargues las credenciales de producción ni actives `MP_VOTES_ENABLED` para una aplicación configurada sólo con `order`.

Para ensayar sin cargos reales, configurá `MP_VOTES_MODE=test` y `MP_VOTES_ENABLED=true` junto con `MP_ACCESS_TOKEN_TEST` y `MP_WEBHOOK_SECRET_TEST` en el servidor. El modo de prueba sólo usa esas credenciales, abre el checkout de prueba y mantiene sus votos separados del ranking real. Para desactivarlo, quitá `MP_VOTES_ENABLED` o ponelo en `false` y redesplegá. Para producción se requiere `MP_VOTES_MODE=live`, credenciales sin `_TEST` y un hosting apto para actividad comercial. Mercado Pago indica que los pagos hechos con credenciales de prueba no envían notificaciones: el checkout se puede ensayar, pero el webhook se prueba por separado con su simulador y tests automatizados.

El código es público; las credenciales son privadas y **nunca** deben agregarse al repositorio ni enviarse por chat. Para preparar la integración:

1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es/docs/getting-started), creá una aplicación de pagos online con **Checkout Pro** para ventas propias. Obtené las [credenciales de prueba y producción](https://www.mercadopago.com.ar/developers/es/docs/credentials) de esa aplicación.
2. Configurá en la aplicación las [notificaciones Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/additional-content/your-integrations/notifications/webhooks) para el evento `payment`. En producción, la URL es `https://super-milei-bros.vercel.app/api/mp-webhook`; copiá la clave de firma generada por Mercado Pago, no el Access Token.
3. En Vercel, **Project > Settings > Environment Variables**, agregá como secretos de servidor `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`. La integración de Redis usa `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o las variables `KV_*` existentes). `MP_RETURN_URL` es opcional y debe apuntar a la URL HTTPS pública; por defecto usa la URL anterior. No uses variables `NEXT_PUBLIC_*` ni pongas credenciales en JavaScript del navegador.
4. Ensayá el checkout y el webhook con credenciales y usuarios de prueba. Comprobá que sólo un pago aprobado de ARS 1.000 suma un voto, que reenvíos no duplican y que un reembolso resta. Configurá credenciales de producción sólo tras estas pruebas y un hosting compatible; por último activá `MP_VOTES_ENABLED=true` en producción.

El servidor crea una preferencia de Checkout Pro por ARS 1.000 para una idea existente. El retorno al sitio no acredita votos: el webhook valida la firma `x-signature`, consulta el pago a Mercado Pago y comprueba ID, referencia firmada, estado aprobado, importe y moneda. Redis cuenta cada ID de pago una sola vez de forma atómica y revierte el voto si el pago pasa a reembolsado. El endpoint de checkout limita intentos por dirección de red usando un HMAC, sin guardar la dirección en texto plano. El pago puede demorar en aparecer en el ranking de ideas. Para conciliar casos de notificaciones perdidas, consultá el panel de notificaciones de Mercado Pago y reenviá el aviso; no marques votos a mano sin verificar el pago.

Vercel [considera comercial solicitar o procesar pagos](https://vercel.com/docs/limits/fair-use-guidelines), aunque indique que pedir donaciones puras no es comercial. Un voto condicionado a ARS 1.000 **no es una donación pura**: no activamos cobros en Hobby, incluso si el dinero sustenta el desarrollo. Para cobrarlos en Vercel corresponde Pro/Enterprise, una excepción escrita de Vercel, o un hosting que permita este uso. El modo sin cobro permanece disponible hasta configurar todo.

## Próximos arcos

No hay límite previsto de niveles. Como ideas para episodios futuros quedan Vaca Muerta y litio como escenarios de recursos, convergencia y "potencia mundial" como motivos narrativos, y Elon como posible cameo. Un cierre de arco podría explorar la recuperación de Malvinas con Javier pilotando un F-16, **sólo como ficción alternativa** y con revisión histórica y editorial para no presentar un conflicto bélico o la soberanía como hecho consumado. Kicillof podría ser un jefe satírico centrado en decisiones públicas, sin insultos sobre su cuerpo ni imputaciones inventadas. Estas propuestas no están implementadas ni comprometen un final para el juego.

La [guía de calidad](QUALITY_GUIDE.md), su [revisión del estado actual](QUALITY_REVIEW.md) y el [aviso y fuentes](aviso.html) sirven de referencia para cada capítulo nuevo.

La propuesta sobre Adorni es una bifurcación ficticia, no una afirmación de culpabilidad. Las cifras distinguen el [testimonio del contratista sobre las reformas y la cascada](https://www.infobae.com/judiciales/2026/05/05/asi-es-la-cascada-que-manuel-adorni-ordeno-construir-en-la-pileta-de-su-casa-del-country-indio-cua/) de la [cifra presentada por la defensa en la investigación patrimonial](https://www.infobae.com/judiciales/2026/09/23/la-justicia-estudia-las-billeteras-virtuales-de-adorni-investigaran-la-trazabilidad-de-los-bitcoins/).

En Buenos Aires, una decisión de gabinete detiene la partida una vez: sostener a Adorni suma periodistas y sobres que dan más puntos al superarlos; pedirle la renuncia suma menos obstáculos, representados como críticas de aliados. Es una línea temporal ficticia y ambas opciones permiten completar el nivel.

En Córdoba, el caso $LIBRA plantea otra bifurcación ficticia: abrir una investigación deja una ruta más segura con críticas, mientras seguir promocionando el proyecto suma econochantas y agoreros. El hecho documentado es que Milei difundió el lanzamiento en redes, luego retiró la publicación y el Gobierno ordenó investigar posibles irregularidades; las opciones y consecuencias del juego no afirman culpabilidad ni representan lo que ocurrió después. Fuentes: [comunicado oficial](https://www.argentina.gob.ar/noticias/anuncio-oficial) y [Decreto 114/2025](https://www.argentina.gob.ar/normativa/nacional/norma-409850/texto).

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

## Contribuir

Para reportar bugs, proponer personajes o enviar un pull request, leé la [guía para contribuir](CONTRIBUTING.md).
