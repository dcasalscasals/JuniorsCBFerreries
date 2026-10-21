# CB Ferreries · Panel de temporada

Webapp responsive en español, preparada para Netlify. El navegador carga el calendario y resultados desde FBIB al abrir el panel, y consulta los detalles de cada acta bajo demanda. La interfaz también conserva la última respuesta en `localStorage`.

## Publicación en Netlify

Conecta el repositorio con Netlify y configura **Publish directory** como `.`; deja **Build command** vacío. Netlify debe desplegar también la carpeta `netlify/functions`; por eso hay que publicar desde un repositorio o CLI compatible con Functions, no mediante arrastrar solo los archivos estáticos.

## Datos

`netlify/functions/live-data.mjs` lee el calendario y marcador del servicio que alimenta FBIB y las estadísticas acumuladas de la API pública de la web de referencia. `netlify/functions/match-details.mjs` obtiene el detalle del acta cuando se abre el análisis de un partido. La web se sincroniza al cargar, al pulsar **Actualizar** y cada cinco minutos mientras está visible. Netlify aplica una caché corta para reducir peticiones.

El análisis de cada encuentro organiza los datos del acta en **RESUM** (barras de anotación por cuarto, porcentajes circulares y comparación de eficacia), **TIRS** (barras de porcentaje por tipo de tiro y cuarto, con desglose por jugador) y **JUGADES** (secuencia de anotación con minuto y marcador progresivo). También incluye una ficha de aportación por jugador y su +/- en pista, calculado con las diferencias de marcador entre entradas y salidas registradas por FBIB. La API entrega eventos de anotación y estadísticas por periodo; algunas actas no contienen jugadas tácticas descritas, y en ese caso la interfaz lo indica sin inventar acciones. El +/- refleja el tanteo durante sus tramos en pista, no atribuye causalidad individual.

Por defecto, las estadísticas acumuladas y actas se leen de `https://juniorascferre.netlify.app`. Publica este panel en un **sitio Netlify separado** y configura `REFERENCE_SITE` si la fuente cambia. Si sustituyes el despliegue de referencia por este panel bajo el mismo dominio, sus endpoints anteriores dejarán de estar disponibles y habrá que migrar también esas funciones.

**Importar datos** sigue disponible como alternativa manual en JSON/CSV. Formato recomendado:

```json
{
  "team": { "name": "CB Ferreries" },
  "matches": [
    {
      "date": "2026-10-24",
      "round": 1,
      "opponent": "Nombre del rival",
      "teamScore": 60,
      "opponentScore": 55,
      "status": "jugado",
      "quarters": [
        { "label": "Q1", "team": 15, "opponent": 12 },
        { "label": "Q2", "team": 14, "opponent": 16 },
        { "label": "Q3", "team": 16, "opponent": 10 },
        { "label": "Q4", "team": 15, "opponent": 17 }
      ],
      "rebounds": 34,
      "assists": 12,
      "turnovers": 15,
      "fouls": 18,
      "players": [
        {
          "name": "Nombre Apellido",
          "minutes": 25,
          "points": 10,
          "twoMade": 3, "twoAttempted": 7,
          "threeMade": 1, "threeAttempted": 4,
          "ftMade": 1, "ftAttempted": 2,
          "rebounds": 5, "assists": 2,
          "steals": 1, "blocks": 0,
          "turnovers": 2, "fouls": 3,
          "efficiency": 9
        }
      ]
    },
    {
      "date": "2026-10-31",
      "round": 2,
      "opponent": "Próximo rival",
      "status": "pendiente"
    }
  ]
}
```

Los campos `quarters` y `players` son opcionales. Si cada partido contiene `players`, la app suma esos registros para crear el acumulado de temporada. Para porcentajes, introduce siempre los tiros anotados **y** los intentados. También se aceptan `partidos`/`jugadores` y algunos nombres de campo en castellano (ver `app.js`). Los CSV sencillos pueden cargarse para listar partidos; para análisis detallados, usa JSON.

La app mantiene la última sincronización local si el servicio no responde. La importación manual puede reemplazar temporalmente los datos visibles de ese navegador; al siguiente refresco se vuelven a cargar los datos conectados.

## Fuentes y diseño

- Equipo: https://www.fbib.es/equipo/10454
- Competición: https://www.fbib.es/competicion/4200
- La identidad visual usa los colores `#edbb00`, `#004d95`, `#111D33`, `#a50044` y el logotipo proporcionado por el club.
