# Revisión contra la guía de calidad

Revisión del 6 de octubre de 2026 sobre el código local, con los criterios de [QUALITY_GUIDE.md](QUALITY_GUIDE.md). Los estados indican evidencia observada, no promesas sobre todos los dispositivos o partidas.

| Área | Estado | Evidencia y brecha |
| --- | --- | --- |
| Progresión y elenco | Parcial | `game.js` persiste Patricia tras 1-1, Toto tras 1-2 y Sturzenegger tras 1-3; el texto de desbloqueo distingue primera victoria de repetición. El selector muestra retratos y armas, bloquea personajes no ganados y evita repetir la dupla. Se inspeccionó el selector local con los tres bloqueados; falta completar los tres niveles en navegador y probar una sesión restaurada. |
| Poder de los perros | Parcial | Al atrapar un mastín se suma una carga; la siguiente habilidad especial muestra tres perros y daña enemigos cercanos. La lógica y el mensaje están en `game.js`; falta comprobar el alcance, la animación y el audio durante una partida real. |
| Nuevo adversario | Parcial | El sindicalista ficticio con mortero aparece en 1-3, tiene anuncio y un proyectil en arco. No representa a una persona real. Falta probar visualmente que el tiro sea legible y esquivable en móvil y escritorio. |
| Mundo y legibilidad | Parcial | Se inspeccionó visualmente la selección y el comienzo del Congreso en escritorio: escena no vacía, hitos y HUD visibles. Siguen sin auditarse todos los recorridos, pozos, capas de fondo y tamaños móviles de los tres niveles. |
| Audio | Pendiente | Hay efectos y pistas en el código, pero no se escucharon en hardware en esta revisión. Las grabaciones acreditadas en README no son las canciones comerciales mencionadas. |
| Ranking e ideas | Parcial | Las APIs tienen pruebas para ranking, ideas, checkout y webhook. El ranking acepta puntajes enviados desde el navegador sin comprobación de la partida; por tanto no es antifraude. En el servidor local sin Redis, las ideas se muestran pero votos y envíos no están disponibles. |
| Votos pagos | Bloqueado para Hobby | Siete pruebas totales incluyen firma, aprobación, idempotencia y reembolso del webhook. No se probó un pago real ni se configuraron credenciales. `MP_VOTES_ENABLED` debe permanecer apagado: Vercel clasifica el voto condicionado a ARS 1.000 como uso comercial incompatible con Hobby. |
| Contador de visitantes | Parcial | La prueba unitaria verifica deduplicación diaria y ausencia de IP en claro. El contador se oculta si falla Redis. Falta probar la escritura/lectura real de Upstash y la cifra pública luego del despliegue. Cuenta navegadores y redes aproximadamente, no personas verificadas. |
| Sátira y fuentes | Parcial | Hay aviso no oficial, enlaces a fuentes y canal de corrección; se retiró el rótulo insultante de un grupo. Falta revisión editorial y legal argentina de todos los textos, caricaturas, licencias y afirmaciones, especialmente los episodios sobre personas reales. El descargo no elimina responsabilidad. |
| Seguridad y carga | Parcial | Los pagos y el ranking usan validación y límites de solicitud. No hay prueba de carga, presupuesto de Redis ni mitigación específica para tráfico masivo a la nueva API de visitantes. El ranking sigue siendo vulnerable a puntajes inventados por diseño. |

## Prioridades antes de otra difusión grande

1. Hacer un recorrido manual completo de 1-1, 1-2 y 1-3 en escritorio y en un móvil real, con foco en saltos, pozos, controles, audio, perro, mortero, fin de nivel y restauración de desbloqueos.
2. Verificar el contador tras desplegarlo con Redis configurado: dos recargas del mismo navegador deben mostrar el mismo total aproximado y otra sesión debe incrementarlo sin romper el juego si Redis falla.
3. Mantener el cobro desactivado en Hobby. Si se pasa a un hosting compatible, usar pruebas de Mercado Pago y validar aprobación, reenvío, reembolso, límites y conciliación antes de habilitar producción.
4. Revisar cada nuevo jefe basado en una persona real con fuentes y asesoramiento legal local. No introducir insultos físicos ni afirmar hechos violentos inventados.

## Ideas futuras, no verificadas ni implementadas

El juego no termina necesariamente en el tercer nivel. Vaca Muerta, litio, convergencia, potencia mundial y un cameo de Elon pueden alimentar nuevos arcos. Malvinas y un F-16 como cierre de arco requieren un tratamiento claramente contrafáctico y especialmente cuidadoso con el conflicto y la soberanía. Kicillof se evalúa como eventual adversario satírico por decisiones públicas, no por su apariencia. Cada nivel adicional deberá desbloquear un personaje nuevo y superar la misma guía antes de anunciarse como jugable.
