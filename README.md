# Competitive Intelligence System - Rappi Mexico

Sistema automatizado de recoleccion y analisis de datos competitivos para Rappi en el mercado mexicano de delivery. Compara precios, tiempos de entrega, fees y estrategias promocionales contra **Uber Eats** y **DiDi Food** en 30 zonas representativas.

---

## Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar browser (solo Chromium, ~130MB)
npm run setup

# 3. Ejecutar scraper completo (30 zonas x 5 productos x 3 plataformas)
npm run scrape

# 4. Generar reporte ejecutivo con insights y visualizaciones
npm run analyze

# 5. Capturar screenshots de evidencia
npm run evidence

# 6. Iniciar dashboard interactivo en http://localhost:3000
npm run dashboard

# 7. Ejecutar tests
npm run test
```

> **Plan B**: Si el scraping en vivo falla por bloqueos anti-bot, el sistema genera automaticamente un reporte con datos de demostracion realistas para garantizar la presentacion.

---

## Decisiones Tecnicas y Justificacion

### Por que Playwright (y no Selenium/Puppeteer/Scrapy)?

| Criterio | Playwright | Selenium | Scrapy |
|----------|-----------|----------|--------|
| SPAs (React/Next.js) | Nativo | Funciona | No soporta JS |
| Anti-detection | API nativa de stealth | Requiere plugins | No aplica |
| Velocidad | Rapido (CDP directo) | Lento (WebDriver) | Muy rapido (HTTP) |
| Geolocation spoofing | API nativa | Complejo | No aplica |
| Multi-browser | Chromium/Firefox/WebKit | Todos | No aplica |

**Decision**: Rappi, Uber Eats y DiDi Food son SPAs renderizadas con React/Next.js. Scrapy (HTTP puro) no puede extraer datos de estas apps. Entre Playwright y Selenium, Playwright ofrece mejor API de stealth, geolocation nativa, y menor overhead.

### Por que Node.js (y no Python)?

Las 3 plataformas target son ecosistemas JavaScript (React/Next.js). Node.js permite:
- Usar Playwright en su entorno nativo (mejor soporte y documentacion)
- Ejecutar evaluaciones de JavaScript en el contexto del browser sin overhead
- Un solo stack para scraping + analisis + dashboard

### Arquitectura modular

```
BaseScraper (retry, anti-detection, parsing)
   ├── RappiScraper
   ├── UberEatsScraper
   └── DidiFoodScraper
```

Cada scraper hereda de `BaseScraper` que provee:
- **Retry con backoff exponencial**: 3 intentos con delays incrementales
- **Anti-detection**: User-agent rotation, stealth scripts, geolocation spoofing
- **Rate limiting**: 2-5s entre requests, 5-8s entre plataformas
- **Safe evaluation**: Try/catch en cada extraccion DOM con fallback a null
- **Logging centralizado**: Cada accion queda registrada en `logs/`

### Estrategia de scraping por plataforma

| Plataforma | URL Base | Estrategia | Desafios |
|-----------|----------|-----------|----------|
| Rappi | rappi.com.mx | Busqueda por producto en restaurantes | Heavy anti-bot, requiere cookies |
| Uber Eats | ubereats.com/mx | Search API + DOM parsing | Location prompt, dynamic loading |
| DiDi Food | didi-food.com/es-MX | Food search page | Menor proteccion, DOM mas limpio |

---

## Scope y Cobertura

### 30 Direcciones Representativas

Seleccion basada en **variabilidad socioeconomica, densidad de cobertura, y relevancia estrategica**:

| Ciudad | Direcciones | Zonas cubiertas |
|--------|------------|-----------------|
| CDMX | 10 | Polanco, Condesa, Roma, Santa Fe, Coyoacan, Iztapalapa, Ecatepec, Centro Historico, CU, Tlalpan |
| Monterrey | 10 | San Pedro, Valle Oriente, Cumbres, Apodaca, Garcia, Juarez, Tec de Monterrey, Fundidora, Centro, Contry |
| Guadalajara | 10 | Andares, Providencia, Zapopan Centro, Tonala, El Salto, Tlaquepaque, UdeG, Chapultepec, Americana, Sta. Tere |

**Justificacion**: Las 3 ciudades representan ~40% del mercado de delivery en Mexico. Las zonas cubren:
- **Alta** (Polanco, San Pedro, Andares): Alto poder adquisitivo, mayor ticket promedio
- **Media** (Coyoacan, Cumbres, Providencia): Clase media, mayor volumen de pedidos
- **Baja** (Iztapalapa, Apodaca, Tonala): Zonas de expansion, alta sensibilidad a precio
- **Turistica/Comercial**: Centro Historico, Fundidora, Tlaquepaque
- **Universitaria**: CU, Tec de MTY, UdeG - segmento joven, alta frecuencia
- **Corporativa**: Santa Fe, Valle Oriente - lunch rush, pedidos grupales

### 5 Productos Estandarizados

| Producto | Categoria | Justificacion |
|----------|----------|--------------|
| Big Mac | Fast Food | Disponible en las 3 plataformas, precio conocido (Big Mac Index) |
| McCombo Mediano | Fast Food | Ticket promedio mas comun, incluye fee de combo |
| McNuggets 10 pzas | Fast Food | Producto compartido, diferente punto de precio |
| Coca-Cola 600ml | Retail/Convenience | Producto de referencia universal, disponible en tiendas |
| Agua Bonafont 1L | Retail/Convenience | Producto basico, bajo margen, revela estrategia de pricing |

### 7 Metricas Recolectadas

1. **Precio del producto** (MXN) - Precio base del item
2. **Delivery fee** - Costo de envio antes de descuentos
3. **Service fee** - Comision de la plataforma al usuario
4. **Tiempo estimado de entrega** - En minutos
5. **Descuentos activos** - Promociones, cupones, ofertas visibles
6. **Disponibilidad** - Tienda abierta/cerrada en ese momento
7. **Precio final total** - Suma real de lo que paga el usuario

---

## Estructura del Proyecto

```
competitive-intelligence-rappi/
├── src/
│   ├── index.js                    # Orquestador principal
│   ├── scrapers/
│   │   ├── baseScraper.js          # Clase base (retry, anti-detection, parsing)
│   │   ├── rappiScraper.js         # Scraper Rappi
│   │   ├── uberEatsScraper.js      # Scraper Uber Eats
│   │   └── didiFoodScraper.js      # Scraper DiDi Food
│   ├── analysis/
│   │   └── generateReport.js       # Motor de analisis + generador HTML
│   ├── scripts/
│   │   └── captureEvidence.js      # Captura de screenshots de evidencia
│   ├── dashboard/
│   │   └── server.js               # Servidor HTTP local (puerto 3000)
│   ├── tests/
│   │   └── runTests.js             # Suite de tests (7 assertions)
│   └── utils/
│       ├── logger.js               # Logger centralizado (console + file)
│       ├── browserManager.js       # Gestor Playwright (stealth, retries)
│       └── addressDataset.js       # 30 direcciones con metadata
├── output/
│   ├── rawData.json                # Datos crudos (JSON)
│   ├── rawData.csv                 # Datos crudos (CSV)
│   ├── report.html                 # Reporte ejecutivo
│   └── insights.json               # Top 5 insights en JSON
├── screenshots/
│   └── evidence/                   # Screenshots de navegacion real
├── logs/
│   └── scraper-YYYY-MM-DD.log     # Logs con timestamps
├── package.json
└── README.md
```

---

## Output: Reporte Ejecutivo

El reporte HTML (`output/report.html`) incluye:

1. **Resumen ejecutivo** con KPIs principales (data points, ciudades, plataformas)
2. **Tabla comparativa general** con highlight del valor mas competitivo
3. **Tabla de precios por producto** con diferencia maxima entre plataformas
4. **6 visualizaciones**:
   - Precio promedio por plataforma (barras horizontales)
   - Estructura de fees: delivery + service (barras)
   - Tiempos de entrega por plataforma (barras)
   - Heatmap de delivery fees por zona (tabla color-coded)
   - Precio total por ciudad y plataforma (barras agrupadas)
5. **Top 5 Insights Accionables** (Finding → Impacto → Recomendacion)
6. **Seccion de Metodologia** con approach tecnico detallado

---

## Etica y Legalidad

- **Solo datos publicos**: Informacion visible para cualquier usuario no autenticado
- **Rate limiting conservador**: 2-5s entre requests, 5-8s entre plataformas
- **User-Agents reales**: Rotacion de 4 user-agents de Chrome/Edge reales
- **Sin sobrecarga**: Diseñado para maximo 1 ejecucion diaria
- **Respeto a robots.txt**: Documentado; si una plataforma bloquea, se registra y se omite
- **Disclaimer**: Ejercicio de reclutamiento. En produccion, consultar con Legal.

---

## Limitaciones y Desafios Enfrentados

### 1. Protecciones Anti-Bot (Principal desafio)
Las 3 plataformas implementan protecciones avanzadas (Cloudflare, fingerprinting, rate limiting por IP). **Solucion**: Stealth scripts, user-agent rotation, delays aleatorios, retry con backoff. **Realidad**: No siempre es suficiente sin proxies rotativos.

### 2. SPAs con Renderizado Dinamico
Los precios se cargan via JavaScript asincrono despues del page load. **Solucion**: `waitUntil: 'domcontentloaded'` + delays post-carga + multiples estrategias de selectores CSS.

### 3. Variabilidad de DOM
Cada plataforma cambia su estructura HTML frecuentemente (A/B testing, releases). **Solucion**: Multiples selectores fallback por metrica. Si todos fallan, se registra null y el analisis maneja datos incompletos.

### 4. Geolocalizacion
Las plataformas muestran diferentes resultados segun ubicacion. **Solucion**: Geolocation API de Playwright para spoofear coordenadas exactas por direccion.

### 5. Datos Demo como Fallback
Si el scraping no extrae datos utiles, el sistema genera datos sinteticos realistas basados en rangos de mercado conocidos. Esto garantiza que el reporte siempre se genera.

---

## Costos

| Recurso | Costo | Nota |
|---------|-------|------|
| Playwright + Chromium | $0 | Open source |
| Proxies rotativos | $0 | No usado (pero recomendado para produccion) |
| ScraperAPI / Bright Data | $0 | No necesario para scope actual |
| Hosting | $0 | Ejecucion local |

**Total: $0** - Solucion 100% cost-free.

En produccion se recomienda: proxies rotativos (~$30-50/mes) y ejecucion en cloud (GitHub Actions gratuito o AWS Lambda ~$5/mes).

---

## Automatizacion Implementada

- **GitHub Actions**: Workflow en `.github/workflows/scrape-schedule.yml` con cron schedule 2x/dia (12:00 y 19:00 hora Mexico, picos de almuerzo y cena). Incluye ejecucion manual via `workflow_dispatch`.
- **Dashboard interactivo**: Filtros por ciudad, plataforma y producto integrados en el reporte HTML.

---

## Escalabilidad y Next Steps

Con mas tiempo, el sistema se puede escalar en 3 dimensiones:

### Corto plazo (1-2 semanas)
- **Mas selectores**: Invertir en reverse engineering de cada plataforma
- **Proxies rotativos**: Bright Data o similar para evitar bloqueos

### Mediano plazo (1-2 meses)
- **Base de datos temporal**: PostgreSQL/TimescaleDB para series de tiempo
- **Dashboard avanzado**: Streamlit o Metabase con graficos interactivos y drill-down
- **Alertas automaticas**: Slack/email cuando un competidor cambia precios >10%
- **Mas verticales**: Farmacias, supermercados, retail

### Largo plazo (3-6 meses)
- **ML de pricing**: Deteccion de anomalias, prediccion de cambios de precio
- **Analisis de elasticidad**: Correlacion precio ↔ demanda estimada
- **API interna**: Endpoint para que equipos de Pricing y Strategy consuman data en tiempo real
- **Comparacion cross-country**: Expandir a Colombia, Brasil, Chile

---

## Troubleshooting

| Problema | Solucion |
|----------|---------|
| Playwright no encuentra Chromium | `npm run setup` o `npx playwright install chromium` |
| Timeout al navegar | Verificar conexion; puede ser bloqueo anti-bot |
| Datos vacios (nulls) | Revisar `logs/` y `screenshots/`; puede ser cambio de DOM |
| Error de dependencias | `npm install --legacy-peer-deps` |
| Puerto 3000 ocupado | Cambiar puerto en `src/dashboard/server.js` |

---

## Licencia

MIT - Proyecto de demostracion para proceso de reclutamiento.
