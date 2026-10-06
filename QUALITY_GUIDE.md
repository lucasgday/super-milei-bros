# Guía de calidad del juego

Esta guía convierte las observaciones de jugadores sobre Super Milei Bros en criterios de aceptación. Se aplica a cada nivel y personaje nuevo, no sólo a los tres capítulos actuales.

## Partida y progresión

- Cada nivel debe poder completarse con teclado y móvil: inicio, decisión, enemigos, jefe, meta, guardado del puntaje y continuación. Probar también derrota y reintento.
- La vida perdida devuelve al jugador a un punto cercano seguro, nunca al inicio salvo que la partida termine. Jugador, acompañante, enemigos y escenografía no pueden caminar o aparecer suspendidos sobre pozos.
- La dificultad debe permitir esquivar ataques de pie y en el aire; los jefes no pueden tener posiciones permanentemente seguras. Los ataques peligrosos se anticipan visual y sonoramente.
- El puntaje se acumula en la misma partida, el ranking es global y el formulario de alias aparece al terminar sin tapar continuar, compartir o ver ranking. El alias no debe capturar las teclas de juego durante la partida.
- Superar cada nivel desbloquea un personaje distinto y persistente. Al repetirlo no debe anunciarse como nuevo. La selección de dupla muestra retratos, arma y habilidad, impide duplicar el mismo personaje y funciona con todos los desbloqueos.
- Las decisiones deben cambiar obstáculos de modo perceptible y justo, sin crear un camino imposible ni confundir una ruta ficticia con un hecho histórico.

## Controles y lectura

- En móvil vertical y apaisado el área jugable debe ser amplia. Los controles deben estar en zonas táctiles separadas, con estados de pulsación claros, transparencia suficiente y sin selección de texto, zoom por doble toque ni conflicto con gestos del navegador.
- En móviles compatibles, pantalla completa debe ser accesible. Cuando no lo sea, se explica la opción de abrir desde la pantalla de inicio sin prometer que el navegador ocultará la barra.
- Botones, carteles, HUD, formularios y mensajes deben leerse sin solapamientos a 360 x 740, 740 x 360, 390 x 844 y escritorio. Los rótulos de enemigos van en avisos temporales, no encima de sus caras.
- Controles de escritorio y acciones secundarias deben ser visibles cuando se necesitan sin consumir espacio permanente del escenario. La pausa y el audio no deben tapar el juego móvil.

## Arte, sonido y mundo

- Cada escenario debe tener hitos reconocibles de su lugar, un fondo propio, parallax coherente y cortes invisibles. Árboles, edificios y personajes de fondo no deben tapar hitos, jefes o pozos de forma incoherente.
- Todo personaje jugable nuevo lleva retrato y animaciones de quieto, carrera y ataque. Enemigos y jefes han de ser distinguibles por silueta y comportamiento; los perros deben ser reconocibles y su recompensa explicarse al atraparlos.
- Monedas, ataques, poderes, daño, vida, victoria y jefes necesitan audio distinguible. Las transiciones musicales no deben superponer pistas de forma disonante ni cortar bruscamente; el control de silencio debe afectar todos los sonidos.
- Ninguna grabación, melodía, imagen o marca de terceros se incorpora sin licencia compatible y atribución. Las referencias a canciones no son permiso para copiarlas.
- Los sprites deben estar optimizados y los recursos exclusivos de niveles posteriores no descargarse al iniciar el primero.

## Comunidad, datos y seguridad

- El ranking y las ideas funcionan sin exponer secretos. Las propuestas de usuarios requieren revisión antes de publicarse y no deben contener datos privados o acusaciones sin fuente.
- Un voto pago sólo cuenta tras confirmación del webhook autenticado, consulta del pago, importe y moneda correctos e idempotencia. Un retorno al sitio no equivale a pago aprobado. Los reembolsos revierten votos.
- El contador público explicita período y aproximación. No usa cookies ni conserva IP en claro; si el almacenamiento falla, desaparece sin impedir jugar.
- Ante alto tráfico, comprobar límites de Vercel, Redis, assets y funciones. Los endpoints de escritura necesitan límites y las fallas externas deben ser aisladas del juego.

## Sátira y afirmaciones

- La interfaz debe decir de forma visible que es ficción satírica independiente y no oficial, con un aviso y canal de corrección accesibles. Un descargo no sustituye revisar el contenido.
- Distinguir citas exactas, paráfrasis, noticias en investigación y ficción. Toda afirmación verificable sobre una persona real lleva fuente y fecha; no presentar acusaciones como condenas.
- No usar rasgos físicos, condiciones personales o identidad de grupos como insulto. La caricatura se centra en posturas y actos de interés público, no en deshumanizar o imputar delitos sin prueba.
- Las personas reales representadas como adversarios requieren una revisión editorial específica antes de publicarse; evitar atribuirles armas o violencia real salvo que haya hechos documentados relevantes.

## Verificación mínima por cambio

1. Ejecutar pruebas afectadas, sintaxis y `git diff --check`.
2. Abrir la web real en escritorio y móvil, comprobar escena no vacía y ausencia de errores de consola.
3. Recorrer al menos la mecánica cambiada, no inferir experiencia visual desde tests unitarios.
4. Registrar explícitamente lo no probado (por ejemplo pagos reales, final de nivel o audio en hardware móvil).
