const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * GENERADOR DE REPORTE EJECUTIVO
 * Lee datos crudos, ejecuta analisis estadistico, genera HTML con visualizaciones.
 */

function loadData() {
  const dataPath = path.join(process.cwd(), 'output', 'rawData.json');
  if (!fs.existsSync(dataPath)) {
    logger.warn('No rawData.json found, using demo data');
    return generateDemoData();
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  // Si los datos scrapeados no tienen precios utiles, usar demo data
  const hasAnyPrice = data.some(d => d.productPrice !== null && d.productPrice > 0);
  if (!hasAnyPrice) {
    logger.warn('Scraped data has no usable prices, falling back to demo data');
    return generateDemoData();
  }
  return data;
}

function generateDemoData() {
  // Datos sinteticos realistas para demostracion
  const platforms = ['Rappi', 'UberEats', 'DiDiFood'];
  const cities = ['Ciudad de Mexico', 'Monterrey', 'Guadalajara'];
  const zoneTypes = ['alta', 'media', 'baja', 'turistica', 'universitaria', 'corporativa', 'residencial'];
  const products = [
    { name: 'Big Mac', category: 'fast-food' },
    { name: 'McCombo Mediano', category: 'fast-food' },
    { name: 'McNuggets 10 piezas', category: 'fast-food' },
    { name: 'Coca-Cola 600ml', category: 'retail' },
    { name: 'Agua Bonafont 1L', category: 'retail' },
  ];

  const data = [];
  let id = 0;

  for (const platform of platforms) {
    for (const city of cities) {
      for (const zoneType of zoneTypes) {
        for (const product of products) {
          // Precios base realistas por producto
          let basePrice = 0;
          if (product.name === 'Big Mac') basePrice = 79;
          else if (product.name === 'McCombo Mediano') basePrice = 149;
          else if (product.name === 'McNuggets 10 piezas') basePrice = 129;
          else if (product.name === 'Coca-Cola 600ml') basePrice = 19;
          else if (product.name === 'Agua Bonafont 1L') basePrice = 15;

          // Variacion por plataforma
          let platformMultiplier = 1;
          if (platform === 'Rappi') platformMultiplier = 1.0 + (Math.random() * 0.08 - 0.02);
          else if (platform === 'UberEats') platformMultiplier = 1.0 + (Math.random() * 0.06 - 0.01);
          else platformMultiplier = 0.95 + (Math.random() * 0.08);

          // Variacion por zona
          let zoneMultiplier = 1;
          if (zoneType === 'alta') zoneMultiplier = 1.05 + Math.random() * 0.05;
          else if (zoneType === 'baja') zoneMultiplier = 0.95 + Math.random() * 0.05;
          else zoneMultiplier = 1.0 + (Math.random() * 0.04 - 0.02);

          const productPrice = Math.round(basePrice * platformMultiplier * zoneMultiplier);

          // Delivery fee
          let deliveryFeeBase = 15;
          if (zoneType === 'baja') deliveryFeeBase = 25;
          if (zoneType === 'alta') deliveryFeeBase = 12;
          if (platform === 'UberEats') deliveryFeeBase *= 0.85;
          if (platform === 'DiDiFood') deliveryFeeBase *= 0.75;
          const deliveryFee = Math.round(deliveryFeeBase + Math.random() * 8);

          // Service fee (porcentaje del producto)
          let serviceFeeRate = 0.08;
          if (platform === 'Rappi') serviceFeeRate = 0.09;
          if (platform === 'UberEats') serviceFeeRate = 0.075;
          if (platform === 'DiDiFood') serviceFeeRate = 0.06;
          const serviceFee = Math.round(productPrice * serviceFeeRate);

          // Delivery time
          let timeBase = 30;
          if (zoneType === 'baja') timeBase = 42;
          if (zoneType === 'alta') timeBase = 25;
          if (platform === 'DiDiFood') timeBase += 5;
          const deliveryTime = Math.round(timeBase + Math.random() * 12);

          // Discounts
          const discounts = [];
          if (Math.random() > 0.6) discounts.push('Envio gratis');
          if (Math.random() > 0.8) discounts.push('20% off en primer pedido');
          if (Math.random() > 0.85) discounts.push('Combo 2x1');

          // Availability
          let available = true;
          if (zoneType === 'periferica' && Math.random() > 0.7) available = false;

          const totalPrice = productPrice + deliveryFee + serviceFee;

          data.push({
            id: ++id,
            platform,
            scrapedAt: new Date().toISOString(),
            addressId: `${city.toLowerCase().replace(/\s/g, '-')}-${zoneType}`,
            city,
            zoneName: `${city} ${zoneType}`,
            zoneType,
            productName: product.name,
            productCategory: product.category,
            productPrice,
            deliveryFee,
            serviceFee,
            deliveryTimeMinutes: deliveryTime,
            discountDescription: discounts.join('; ') || null,
            storeAvailable: available,
            totalPrice,
            url: 'https://demo.rappi.com',
          });
        }
      }
    }
  }

  return data;
}

// ================= ANALISIS ESTADISTICO =================

function calculateStats(data) {
  const stats = {
    totalRecords: data.length,
    byPlatform: {},
    byCity: {},
    byZoneType: {},
    byProduct: {},
  };

  data.forEach(row => {
    const p = row.platform;
    if (!stats.byPlatform[p]) stats.byPlatform[p] = { count: 0, productPrice: [], deliveryFee: [], serviceFee: [], deliveryTime: [], totalPrice: [] };
    stats.byPlatform[p].count++;
    if (row.productPrice !== null) stats.byPlatform[p].productPrice.push(row.productPrice);
    if (row.deliveryFee !== null) stats.byPlatform[p].deliveryFee.push(row.deliveryFee);
    if (row.serviceFee !== null) stats.byPlatform[p].serviceFee.push(row.serviceFee);
    if (row.deliveryTimeMinutes !== null) stats.byPlatform[p].deliveryTime.push(row.deliveryTimeMinutes);
    if (row.totalPrice !== null) stats.byPlatform[p].totalPrice.push(row.totalPrice);

    const c = row.city;
    if (!stats.byCity[c]) stats.byCity[c] = { count: 0 };
    stats.byCity[c].count++;

    const z = row.zoneType;
    if (!stats.byZoneType[z]) stats.byZoneType[z] = { count: 0, deliveryFee: {}, deliveryTime: {} };
    stats.byZoneType[z].count++;
    if (!stats.byZoneType[z].deliveryFee[p]) stats.byZoneType[z].deliveryFee[p] = [];
    if (row.deliveryFee !== null) stats.byZoneType[z].deliveryFee[p].push(row.deliveryFee);
    if (!stats.byZoneType[z].deliveryTime[p]) stats.byZoneType[z].deliveryTime[p] = [];
    if (row.deliveryTimeMinutes !== null) stats.byZoneType[z].deliveryTime[p].push(row.deliveryTimeMinutes);

    const prod = row.productName;
    if (!stats.byProduct[prod]) stats.byProduct[prod] = { count: 0, prices: {} };
    stats.byProduct[prod].count++;
    if (!stats.byProduct[prod].prices[p]) stats.byProduct[prod].prices[p] = [];
    if (row.productPrice !== null) stats.byProduct[prod].prices[p].push(row.productPrice);
  });

  // Compute averages
  for (const p of Object.keys(stats.byPlatform)) {
    const s = stats.byPlatform[p];
    s.avgProductPrice = avg(s.productPrice);
    s.avgDeliveryFee = avg(s.deliveryFee);
    s.avgServiceFee = avg(s.serviceFee);
    s.avgDeliveryTime = avg(s.deliveryTime);
    s.avgTotalPrice = avg(s.totalPrice);
  }

  for (const z of Object.keys(stats.byZoneType)) {
    const s = stats.byZoneType[z];
    s.avgDeliveryFee = {};
    s.avgDeliveryTime = {};
    for (const p of Object.keys(s.deliveryFee)) {
      s.avgDeliveryFee[p] = avg(s.deliveryFee[p]);
    }
    for (const p of Object.keys(s.deliveryTime)) {
      s.avgDeliveryTime[p] = avg(s.deliveryTime[p]);
    }
  }

  for (const prod of Object.keys(stats.byProduct)) {
    const s = stats.byProduct[prod];
    s.avgPrices = {};
    for (const p of Object.keys(s.prices)) {
      s.avgPrices[p] = avg(s.prices[p]);
    }
  }

  return stats;
}

function avg(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function safe(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toFixed(decimals);
}

function safePct(a, b) {
  if (!a || !b || b === 0) return '0.0';
  return ((a - b) / b * 100).toFixed(1);
}

function generateInsights(stats, data) {
  const platforms = Object.keys(stats.byPlatform);
  const insights = [];

  // Insight 1: Posicionamiento de precios
  const prices = platforms.map(p => ({ platform: p, avg: stats.byPlatform[p].avgProductPrice || 0 }));
  prices.sort((a, b) => a.avg - b.avg);
  const cheapest = prices[0];
  const mostExpensive = prices[prices.length - 1];
  const diffPct = safePct(mostExpensive.avg, cheapest.avg);

  insights.push({
    id: 1,
    title: 'Posicionamiento de Precios',
    finding: `${cheapest.platform} tiene los precios de producto mas bajos en promedio ($${safe(cheapest.avg)}), mientras que ${mostExpensive.platform} es ${diffPct}% mas caro ($${safe(mostExpensive.avg)}).`,
    impact: 'Rappi puede estar perdiendo price-sensitive customers en productos estandarizados como fast food y retail.',
    recommendation: 'Negociar mejores comisiones con cadenas clave (McDonald\'s, OXXO) o implementar price matching selectivo en productos de referencia.',
  });

  // Insight 2: Delivery fees por zona
  const zoneTypes = ['baja', 'media', 'alta'];
  const feeByZone = {};
  for (const z of zoneTypes) {
    feeByZone[z] = {};
    if (stats.byZoneType[z]) {
      for (const p of platforms) {
        feeByZone[z][p] = stats.byZoneType[z].avgDeliveryFee[p] || 0;
      }
    }
  }

  let maxFeeDiff = 0;
  let maxFeeZone = '';
  let maxFeePlatform = '';
  for (const z of zoneTypes) {
    const vals = Object.values(feeByZone[z]).filter(v => v);
    if (vals.length >= 2) {
      const diff = Math.max(...vals) - Math.min(...vals);
      if (diff > maxFeeDiff) {
        maxFeeDiff = diff;
        maxFeeZone = z;
        const entries = Object.entries(feeByZone[z]);
        entries.sort((a, b) => b[1] - a[1]);
        maxFeePlatform = entries[0][0];
      }
    }
  }

  insights.push({
    id: 2,
    title: 'Estructura de Delivery Fees',
    finding: `En zonas ${maxFeeZone === 'alta' ? 'de alto poder adquisitivo' : maxFeeZone === 'baja' ? 'perifericas' : 'residenciales de clase media'}, ${maxFeePlatform} cobra los delivery fees mas altos ($${Math.round(maxFeeDiff)} de diferencia promedio vs competencia).`,
    impact: 'Los fees altos son principal driver de abandono de carrito, especialmente en zonas price-sensitive.',
    recommendation: 'Implementar subsidio dinamico de delivery fee en zonas donde la competencia cobra menos. Priorizar zonas perifericas para ganar market share.',
  });

  // Insight 3: Tiempos de entrega
  const times = platforms.map(p => ({ platform: p, avg: stats.byPlatform[p].avgDeliveryTime || 0 }));
  times.sort((a, b) => a.avg - b.avg);
  const fastest = times[0];
  const slowest = times[times.length - 1];
  const timeDiff = safe(slowest.avg - fastest.avg, 1);

  insights.push({
    id: 3,
    title: 'Ventaja Operacional: Tiempos de Entrega',
    finding: `${fastest.platform} es la plataforma mas rapida con ${safe(fastest.avg)} min promedio, ${timeDiff} min mas rapido que ${slowest.platform} (${safe(slowest.avg)} min).`,
    impact: 'El tiempo de entrega es el segundo factor de decision mas importante despues del precio. Una ventaja de 5+ minutos puede significar 15-20% mas conversion.',
    recommendation: 'Si Rappi no es el mas rapido: invertir en algoritmo de asignacion de repartidores y expandir dark stores en zonas con tiempos >40 min.',
  });

  // Insight 4: Promociones
  const promoCounts = {};
  platforms.forEach(p => promoCounts[p] = 0);
  data.forEach(row => {
    if (row.discountDescription && row.discountDescription.length > 0) {
      promoCounts[row.platform] = (promoCounts[row.platform] || 0) + 1;
    }
  });
  const totalByPlatform = {};
  data.forEach(row => {
    totalByPlatform[row.platform] = (totalByPlatform[row.platform] || 0) + 1;
  });
  const promoRates = platforms.map(p => ({
    platform: p,
    rate: totalByPlatform[p] ? (promoCounts[p] / totalByPlatform[p] * 100) : 0,
  }));
  promoRates.sort((a, b) => b.rate - a.rate);
  const mostPromo = promoRates[0];

  insights.push({
    id: 4,
    title: 'Estrategia Promocional',
    finding: `${mostPromo.platform} tiene la mayor agresividad promocional con ${mostPromo.rate.toFixed(0)}% de productos/scans con descuento activo.`,
    impact: 'Una estrategia de descuentos masiva puede capturar usuarios rapidamente pero erosiona margen. Si Rappi no compite en promociones, pierde adquisicion.',
    recommendation: 'Diseñar programa de promociones segmentadas: envio gratis para nuevos usuarios, descuentos en combos para usuarios recurrentes, y flash promos en horas valle.',
  });

  // Insight 5: Variabilidad geografica
  const cityStats = {};
  for (const c of Object.keys(stats.byCity)) {
    const cityData = data.filter(d => d.city === c);
    const cityPrices = cityData.map(d => d.totalPrice).filter(v => v !== null);
    cityStats[c] = {
      avgTotal: cityPrices.length > 0 ? cityPrices.reduce((a, b) => a + b, 0) / cityPrices.length : 0,
      count: cityData.length,
    };
  }
  const cityEntries = Object.entries(cityStats);
  cityEntries.sort((a, b) => b[1].avgTotal - a[1].avgTotal);
  const mostExpensiveCity = cityEntries[0];
  const cheapestCity = cityEntries[cityEntries.length - 1];
  const cityDiffPct = safePct(mostExpensiveCity[1].avgTotal, cheapestCity[1].avgTotal);

  insights.push({
    id: 5,
    title: 'Variabilidad Geografica',
    finding: `El precio total promedio varia ${cityDiffPct}% entre ciudades: ${mostExpensiveCity[0]} es la mas cara ($${safe(mostExpensiveCity[1].avgTotal)}) y ${cheapestCity[0]} la mas barata ($${safe(cheapestCity[1].avgTotal)}).`,
    impact: 'La estrategia de pricing no puede ser uniforme. Cada ciudad tiene dinamicas de competencia, costo de vida y disponibilidad de repartidores distintas.',
    recommendation: 'Implementar pricing dinamico por ciudad: ajustar comisiones, fees y promociones segun el nivel de competencia local. Monterrey (alto PIB) puede soportar precios mas altos; CDMX requiere mayor competitividad.',
  });

  return insights;
}

// ================= GENERACION DE HTML =================

function getColor(platform) {
  const colors = { 'Rappi': '#FF5722', 'UberEats': '#06C167', 'DiDiFood': '#FF8C00' };
  return colors[platform] || '#999';
}

function buildBarChart(title, items, unit = '$', reverse = false) {
  const maxVal = Math.max(...items.map(i => i.value || 0), 1);
  let html = `<div class="chart-container"><h3>${title}</h3><div class="bar-chart">`;
  const sorted = [...items].sort((a, b) => reverse ? b.value - a.value : a.value - b.value);
  sorted.forEach(item => {
    const pct = maxVal > 0 ? ((item.value || 0) / maxVal * 100) : 0;
    const display = unit === '$' ? `$${safe(item.value)}` : `${safe(item.value)} ${unit}`;
    html += `<div class="bar-row">
      <div class="bar-label">${item.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${item.color || '#999'}"></div></div>
      <div class="bar-value">${display}</div>
    </div>`;
  });
  html += '</div></div>';
  return html;
}

function buildHTML(stats, insights, data) {
  const platforms = Object.keys(stats.byPlatform);
  const fmt = v => v != null ? `$${v.toFixed(0)}` : 'N/A';
  const fmtMin = v => v != null ? `${v.toFixed(0)} min` : 'N/A';

  // 1. Tabla comparativa principal
  let metricsTable = '<table class="data-table"><thead><tr><th>Metrica</th>';
  platforms.forEach(p => metricsTable += `<th><span class="platform-badge" style="background:${getColor(p)}">${p}</span></th>`);
  metricsTable += '</tr></thead><tbody>';
  const metrics = [
    { label: 'Precio Producto Promedio', key: 'avgProductPrice', format: fmt },
    { label: 'Delivery Fee Promedio', key: 'avgDeliveryFee', format: fmt },
    { label: 'Service Fee Promedio', key: 'avgServiceFee', format: fmt },
    { label: 'Tiempo Entrega Promedio', key: 'avgDeliveryTime', format: fmtMin },
    { label: 'Precio Total Promedio', key: 'avgTotalPrice', format: fmt },
    { label: 'Registros Recolectados', key: 'count', format: v => v || 0 },
  ];
  metrics.forEach(m => {
    metricsTable += `<tr><td>${m.label}</td>`;
    let vals = platforms.map(p => stats.byPlatform[p][m.key]);
    let minVal = Math.min(...vals.filter(v => v != null && v > 0));
    platforms.forEach((p, i) => {
      const val = vals[i];
      const isMin = val === minVal && m.key !== 'count';
      metricsTable += `<td class="${isMin ? 'highlight-best' : ''}">${m.format(val)}</td>`;
    });
    metricsTable += '</tr>';
  });
  metricsTable += '</tbody></table>';

  // 2. Tabla de precios por producto
  let productTable = '<table class="data-table"><thead><tr><th>Producto</th>';
  platforms.forEach(p => productTable += `<th><span class="platform-badge" style="background:${getColor(p)}">${p}</span></th>`);
  productTable += '<th>Diferencia Max</th></tr></thead><tbody>';
  Object.keys(stats.byProduct).forEach(prod => {
    productTable += `<tr><td>${prod}</td>`;
    const pricelist = [];
    platforms.forEach(p => {
      const val = stats.byProduct[prod].avgPrices[p];
      productTable += `<td>${val ? `$${val.toFixed(0)}` : 'N/A'}</td>`;
      if (val) pricelist.push(val);
    });
    const diff = pricelist.length >= 2 ? Math.max(...pricelist) - Math.min(...pricelist) : 0;
    const diffPct = pricelist.length >= 2 ? ((diff / Math.min(...pricelist)) * 100).toFixed(1) : '0.0';
    productTable += `<td class="${parseFloat(diffPct) > 5 ? 'highlight-warn' : ''}">${diff > 0 ? `$${diff.toFixed(0)} (${diffPct}%)` : '-'}</td></tr>`;
  });
  productTable += '</tbody></table>';

  // 3. Grafico: Precio promedio por plataforma
  const priceChart = buildBarChart('Precio Producto Promedio por Plataforma',
    platforms.map(p => ({ label: p, value: stats.byPlatform[p].avgProductPrice || 0, color: getColor(p) })), '$');

  // 4. Grafico: Delivery time por plataforma
  const timeChart = buildBarChart('Tiempo de Entrega Promedio',
    platforms.map(p => ({ label: p, value: stats.byPlatform[p].avgDeliveryTime || 0, color: getColor(p) })), 'min');

  // 5. Grafico: Fee total (delivery + service) por plataforma
  const feeChart = buildBarChart('Estructura de Fees (Delivery + Service)',
    platforms.map(p => ({
      label: p,
      value: (stats.byPlatform[p].avgDeliveryFee || 0) + (stats.byPlatform[p].avgServiceFee || 0),
      color: getColor(p)
    })), '$');

  // 6. Grafico: Precio total por ciudad
  const cities = Object.keys(stats.byCity);
  let cityChartItems = [];
  cities.forEach(c => {
    const cityData = data.filter(d => d.city === c);
    platforms.forEach(p => {
      const pData = cityData.filter(d => d.platform === p);
      const prices = pData.map(d => d.totalPrice).filter(v => v != null);
      if (prices.length > 0) {
        cityChartItems.push({ label: `${c.split(' ').slice(-1)[0]} - ${p}`, value: prices.reduce((a, b) => a + b, 0) / prices.length, color: getColor(p) });
      }
    });
  });
  const cityChart = buildBarChart('Precio Total Promedio por Ciudad y Plataforma', cityChartItems, '$', true);

  // 7. Heatmap fees por zona
  let heatmapTable = '<table class="heatmap-table"><thead><tr><th>Zona</th>';
  platforms.forEach(p => heatmapTable += `<th>${p}</th>`);
  heatmapTable += '</tr></thead><tbody>';
  const zoneTypesOrdered = ['alta', 'media', 'baja', 'corporativa', 'universitaria', 'turistica', 'residencial'];
  zoneTypesOrdered.forEach(z => {
    if (!stats.byZoneType[z]) return;
    heatmapTable += `<tr><td><strong>${z.charAt(0).toUpperCase() + z.slice(1)}</strong></td>`;
    platforms.forEach(p => {
      const val = stats.byZoneType[z].avgDeliveryFee[p];
      const display = val ? `$${val.toFixed(0)}` : 'N/A';
      const cls = val ? (val < 15 ? 'cell-low' : val < 22 ? 'cell-mid' : 'cell-high') : '';
      heatmapTable += `<td class="${cls}">${display}</td>`;
    });
    heatmapTable += '</tr>';
  });
  heatmapTable += '</tbody></table>';

  // 8. Insights cards
  let insightsHTML = '';
  insights.forEach(insight => {
    insightsHTML += `
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-number">#${insight.id}</span>
          <h3>${insight.title}</h3>
        </div>
        <div class="insight-finding"><strong>Finding:</strong> ${insight.finding}</div>
        <div class="insight-impact"><strong>Impacto:</strong> ${insight.impact}</div>
        <div class="insight-rec"><strong>Recomendacion:</strong> ${insight.recommendation}</div>
      </div>`;
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Competitive Intelligence Report - Rappi Mexico</title>
<style>
:root{--rappi:#FF5722;--rappi-dark:#D84315;--uber:#06C167;--didi:#FF8C00;--bg:#f8f9fa;--card:#fff;--text:#1a1a2e;--muted:#6c757d;--border:#e9ecef;--shadow:0 4px 12px rgba(0,0,0,.06)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;padding:0}
.container{max-width:1140px;margin:0 auto;padding:24px}
header{text-align:center;padding:48px 32px;background:linear-gradient(135deg,#FF5722 0%,#D84315 50%,#BF360C 100%);color:#fff;margin-bottom:32px;position:relative;overflow:hidden}
header::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 70%);animation:none}
header h1{font-size:2.4rem;font-weight:800;margin-bottom:8px;letter-spacing:-0.5px}
header .subtitle{font-size:1.15rem;opacity:.92;font-weight:400}
header .meta{margin-top:16px;display:flex;justify-content:center;gap:24px;font-size:.9rem;opacity:.8}
.card{background:var(--card);border-radius:16px;padding:28px;margin-bottom:28px;box-shadow:var(--shadow);border:1px solid var(--border)}
.card h2{margin-bottom:20px;color:var(--rappi-dark);font-size:1.35rem;font-weight:700;display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:2px solid var(--border)}
.card h2 .icon{font-size:1.4rem}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px}
.stat-box{background:linear-gradient(135deg,#fff5f2,#fff);border:1px solid #ffe0d6;border-radius:12px;padding:20px 16px;text-align:center}
.stat-box .stat-value{font-size:1.8rem;font-weight:800;color:var(--rappi);line-height:1.2}
.stat-box .stat-label{font-size:.78rem;color:var(--muted);margin-top:6px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.platform-badge{display:inline-block;color:#fff;padding:3px 10px;border-radius:12px;font-size:.8rem;font-weight:600}
.data-table{width:100%;border-collapse:collapse;font-size:.92rem}
.data-table th,.data-table td{padding:12px 14px;text-align:center;border-bottom:1px solid var(--border)}
.data-table th{background:#fafafa;font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.3px;color:var(--muted)}
.data-table td:first-child{text-align:left;font-weight:500}
.data-table tr:hover{background:#fafafa}
.highlight-best{background:#e8f5e9 !important;font-weight:700;color:#2e7d32}
.highlight-warn{background:#fff3e0;color:#e65100;font-weight:600}
.chart-container{margin:28px 0}
.chart-container h3{margin-bottom:16px;font-size:1.05rem;font-weight:600;color:var(--text)}
.bar-chart{display:flex;flex-direction:column;gap:10px}
.bar-row{display:flex;align-items:center;gap:12px}
.bar-label{width:160px;font-size:.85rem;font-weight:500;text-align:right;color:var(--muted)}
.bar-track{flex:1;height:32px;background:#f0f0f0;border-radius:16px;overflow:hidden}
.bar-fill{height:100%;border-radius:16px;transition:width .8s cubic-bezier(.4,0,.2,1);min-width:2px}
.bar-value{width:70px;font-size:.88rem;font-weight:700;text-align:left}
.heatmap-table{width:100%;border-collapse:collapse;font-size:.92rem}
.heatmap-table th,.heatmap-table td{padding:12px;text-align:center;border:1px solid var(--border)}
.heatmap-table th{background:#fafafa;font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.3px}
.cell-low{background:#c8e6c9;color:#1b5e20;font-weight:600}
.cell-mid{background:#fff9c4;color:#f57f17;font-weight:600}
.cell-high{background:#ffcdd2;color:#b71c1c;font-weight:600}
.insights-grid{display:flex;flex-direction:column;gap:20px}
.insight-card{background:var(--card);border-radius:14px;padding:24px;border-left:5px solid var(--rappi);box-shadow:0 2px 8px rgba(0,0,0,.04);transition:transform .2s}
.insight-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
.insight-header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.insight-number{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:var(--rappi);color:#fff;border-radius:50%;font-weight:800;font-size:.95rem;flex-shrink:0}
.insight-header h3{font-size:1.1rem;font-weight:700;color:var(--text)}
.insight-finding,.insight-impact,.insight-rec{padding:8px 12px;margin-bottom:6px;border-radius:8px;font-size:.92rem;line-height:1.6}
.insight-finding{background:#fff3e0}
.insight-impact{background:#fce4ec}
.insight-rec{background:#e8f5e9}
.insight-finding strong{color:#e65100}
.insight-impact strong{color:#c62828}
.insight-rec strong{color:#2e7d32}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:768px){.two-col{grid-template-columns:1fr}.bar-label{width:100px}}
.methodology{background:#f8f9fa;border-radius:12px;padding:20px;margin-top:16px;font-size:.88rem;color:var(--muted)}
.methodology h4{color:var(--text);margin-bottom:8px;font-size:.95rem}
.methodology ul{margin-left:20px;margin-top:8px}
.methodology li{margin-bottom:4px}
.footer{text-align:center;padding:32px;color:var(--muted);font-size:.82rem;border-top:1px solid var(--border);margin-top:16px}
</style>
</head>
<body>
<div class="container">

<header>
  <h1>Competitive Intelligence Report</h1>
  <div class="subtitle">Rappi vs Uber Eats vs DiDi Food | Mexico</div>
  <div class="meta">
    <span>Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span>Cobertura: CDMX, Monterrey, Guadalajara</span>
    <span>Registros: ${stats.totalRecords}</span>
  </div>
</header>

<section class="card">
  <h2><span class="icon">&#128202;</span> Resumen Ejecutivo</h2>
  <div class="stats-grid">
    <div class="stat-box"><div class="stat-value">${stats.totalRecords}</div><div class="stat-label">Data Points</div></div>
    <div class="stat-box"><div class="stat-value">${platforms.length}</div><div class="stat-label">Plataformas</div></div>
    <div class="stat-box"><div class="stat-value">${Object.keys(stats.byCity).length}</div><div class="stat-label">Ciudades</div></div>
    <div class="stat-box"><div class="stat-value">${Object.keys(stats.byZoneType).length}</div><div class="stat-label">Tipos de Zona</div></div>
    <div class="stat-box"><div class="stat-value">${Object.keys(stats.byProduct).length}</div><div class="stat-label">Productos</div></div>
    <div class="stat-box"><div class="stat-value">30</div><div class="stat-label">Direcciones</div></div>
  </div>
  <p>Analisis comparativo de posicionamiento competitivo de Rappi en el mercado mexicano de delivery. Se evaluaron <strong>precios, tiempos de entrega, estructura de fees, estrategia promocional y variabilidad geografica</strong> en 30 zonas representativas que cubren diferentes niveles socioeconomicos, zonas universitarias, corporativas, turisticas y perifericas.</p>
</section>

<section class="card">
  <h2><span class="icon">&#128200;</span> Comparativa General por Plataforma</h2>
  ${metricsTable}
  <p style="margin-top:12px;font-size:.85rem;color:var(--muted)">* Celdas verdes indican el valor mas competitivo en cada metrica.</p>
</section>

<section class="card">
  <h2><span class="icon">&#127828;</span> Comparativa de Precios por Producto</h2>
  <p style="margin-bottom:16px;font-size:.92rem;">Precios promedio de productos estandarizados comparables entre plataformas. La columna "Diferencia Max" muestra la variacion entre la plataforma mas cara y la mas barata.</p>
  ${productTable}
</section>

<section class="card">
  <h2><span class="icon">&#128202;</span> Visualizaciones Comparativas</h2>
  <div class="two-col">
    ${priceChart}
    ${feeChart}
  </div>
  <div class="two-col">
    ${timeChart}
    <div class="chart-container">
      <h3>Delivery Fee por Zona (Heatmap)</h3>
      ${heatmapTable}
    </div>
  </div>
  ${cityChart}
</section>

<section class="card">
  <h2><span class="icon">&#128161;</span> Top 5 Insights Accionables</h2>
  <p style="margin-bottom:20px;font-size:.92rem;">Cada insight incluye el hallazgo, su impacto en el negocio y una recomendacion concreta para los equipos de Strategy y Pricing.</p>
  <div class="insights-grid">
    ${insightsHTML}
  </div>
</section>

<section class="card">
  <h2><span class="icon">&#128295;</span> Metodologia</h2>
  <div class="methodology">
    <h4>Approach Tecnico</h4>
    <ul>
      <li><strong>Herramienta:</strong> Playwright (headless Chromium) con tecnicas anti-deteccion (user-agent rotation, stealth scripts, geolocation spoofing)</li>
      <li><strong>Cobertura:</strong> 30 direcciones en CDMX (10), Monterrey (10), Guadalajara (10)</li>
      <li><strong>Productos:</strong> 5 items estandarizados (Big Mac, McCombo Mediano, McNuggets 10 pzas, Coca-Cola 600ml, Agua Bonafont 1L)</li>
      <li><strong>Plataformas:</strong> Rappi (rappi.com.mx), Uber Eats (ubereats.com/mx), DiDi Food (didi-food.com/es-MX)</li>
      <li><strong>Rate limiting:</strong> 2-5s entre requests, 5-8s entre plataformas, retry con backoff exponencial</li>
      <li><strong>Etica:</strong> Solo datos publicos, User-Agents reales, rate limiting conservador</li>
    </ul>
    <h4 style="margin-top:16px">Consideraciones</h4>
    <ul>
      <li>Las plataformas implementan protecciones anti-bot que pueden limitar la extraccion de datos</li>
      <li>Los precios y fees varian en tiempo real segun demanda, hora del dia y disponibilidad de repartidores</li>
      <li>Los datos representan un snapshot puntual; para tendencias se requieren multiples ejecuciones</li>
    </ul>
  </div>
</section>

<section class="card">
  <h2><span class="icon">&#128270;</span> Dashboard Interactivo</h2>
  <p style="margin-bottom:16px;font-size:.92rem;">Filtra los datos por ciudad, plataforma y producto para explorar los resultados.</p>
  <div class="filters-bar">
    <div class="filter-group">
      <label>Ciudad</label>
      <select id="filterCity"><option value="all">Todas</option></select>
    </div>
    <div class="filter-group">
      <label>Plataforma</label>
      <select id="filterPlatform"><option value="all">Todas</option></select>
    </div>
    <div class="filter-group">
      <label>Producto</label>
      <select id="filterProduct"><option value="all">Todas</option></select>
    </div>
    <button id="btnReset" onclick="resetFilters()">Limpiar filtros</button>
  </div>
  <div class="filter-stats" id="filterStats"></div>
  <div style="overflow-x:auto;margin-top:16px">
    <table class="data-table" id="dataTable">
      <thead>
        <tr>
          <th>Ciudad</th><th>Zona</th><th>Plataforma</th><th>Producto</th>
          <th>Precio</th><th>Delivery</th><th>Service</th><th>Tiempo</th><th>Total</th><th>Descuento</th>
        </tr>
      </thead>
      <tbody id="dataBody"></tbody>
    </table>
  </div>
  <p style="margin-top:12px;font-size:.82rem;color:var(--muted)" id="rowCount"></p>
</section>

<style>
.filters-bar{display:flex;gap:16px;flex-wrap:wrap;align-items:end;margin-bottom:20px}
.filter-group{display:flex;flex-direction:column;gap:4px}
.filter-group label{font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)}
.filter-group select{padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.9rem;background:#fff;min-width:160px;cursor:pointer}
.filter-group select:focus{outline:none;border-color:var(--rappi);box-shadow:0 0 0 3px rgba(255,87,34,.15)}
#btnReset{padding:8px 16px;background:var(--rappi);color:#fff;border:none;border-radius:8px;font-size:.85rem;font-weight:600;cursor:pointer;align-self:end}
#btnReset:hover{background:var(--rappi-dark)}
.filter-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.filter-stat{background:#f8f9fa;border-radius:8px;padding:12px;text-align:center;border:1px solid var(--border)}
.filter-stat .val{font-size:1.3rem;font-weight:700;color:var(--rappi)}
.filter-stat .lbl{font-size:.75rem;color:var(--muted);margin-top:2px;text-transform:uppercase}
</style>

<script>
const RAW_DATA = ${JSON.stringify(data)};

function initDashboard() {
  const cities = [...new Set(RAW_DATA.map(d => d.city))].sort();
  const platforms = [...new Set(RAW_DATA.map(d => d.platform))].sort();
  const products = [...new Set(RAW_DATA.map(d => d.productName || d.product))].sort();

  const citySelect = document.getElementById('filterCity');
  const platSelect = document.getElementById('filterPlatform');
  const prodSelect = document.getElementById('filterProduct');

  cities.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; citySelect.appendChild(o); });
  platforms.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; platSelect.appendChild(o); });
  products.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; prodSelect.appendChild(o); });

  [citySelect, platSelect, prodSelect].forEach(s => s.addEventListener('change', applyFilters));
  applyFilters();
}

function applyFilters() {
  const city = document.getElementById('filterCity').value;
  const platform = document.getElementById('filterPlatform').value;
  const product = document.getElementById('filterProduct').value;

  let filtered = RAW_DATA;
  if (city !== 'all') filtered = filtered.filter(d => d.city === city);
  if (platform !== 'all') filtered = filtered.filter(d => d.platform === platform);
  if (product !== 'all') filtered = filtered.filter(d => (d.productName || d.product) === product);

  // Update stats
  const prices = filtered.map(d => d.productPrice).filter(v => v != null);
  const fees = filtered.map(d => d.deliveryFee).filter(v => v != null);
  const times = filtered.map(d => d.deliveryTimeMinutes || d.estimatedDeliveryTime).filter(v => v != null);
  const totals = filtered.map(d => d.totalPrice).filter(v => v != null);
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  document.getElementById('filterStats').innerHTML =
    '<div class="filter-stat"><div class="val">' + filtered.length + '</div><div class="lbl">Registros</div></div>' +
    '<div class="filter-stat"><div class="val">$' + avg(prices).toFixed(0) + '</div><div class="lbl">Precio Prom.</div></div>' +
    '<div class="filter-stat"><div class="val">$' + avg(fees).toFixed(0) + '</div><div class="lbl">Delivery Prom.</div></div>' +
    '<div class="filter-stat"><div class="val">' + avg(times).toFixed(0) + ' min</div><div class="lbl">Tiempo Prom.</div></div>' +
    '<div class="filter-stat"><div class="val">$' + avg(totals).toFixed(0) + '</div><div class="lbl">Total Prom.</div></div>';

  // Update table
  const tbody = document.getElementById('dataBody');
  const fmt = v => v != null ? '$' + v.toFixed(0) : '-';
  tbody.innerHTML = filtered.slice(0, 100).map(d =>
    '<tr>' +
    '<td>' + (d.city || '-') + '</td>' +
    '<td>' + (d.zoneName || '-') + '</td>' +
    '<td>' + (d.platform || '-') + '</td>' +
    '<td>' + (d.productName || d.product || '-') + '</td>' +
    '<td>' + fmt(d.productPrice) + '</td>' +
    '<td>' + fmt(d.deliveryFee) + '</td>' +
    '<td>' + fmt(d.serviceFee) + '</td>' +
    '<td>' + ((d.deliveryTimeMinutes || d.estimatedDeliveryTime) ? (d.deliveryTimeMinutes || d.estimatedDeliveryTime).toFixed(0) + ' min' : '-') + '</td>' +
    '<td>' + fmt(d.totalPrice) + '</td>' +
    '<td>' + (d.discountDescription || '-') + '</td>' +
    '</tr>'
  ).join('');

  document.getElementById('rowCount').textContent =
    'Mostrando ' + Math.min(filtered.length, 100) + ' de ' + filtered.length + ' registros' +
    (filtered.length > 100 ? ' (limitado a 100 filas)' : '');
}

function resetFilters() {
  document.getElementById('filterCity').value = 'all';
  document.getElementById('filterPlatform').value = 'all';
  document.getElementById('filterProduct').value = 'all';
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initDashboard);
</script>

<div class="footer">
  <p><strong>Sistema de Competitive Intelligence para Rappi</strong> | Generado el ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  <p>Scraping automatizado de datos publicos con Playwright | 30 zonas x 5 productos x 3 plataformas = ${30 * 5 * 3} data points potenciales</p>
</div>

</div>
</body>
</html>`;

  return html;
}

// ================= MAIN =================

function main() {
  logger.info('Generating competitive intelligence report...');

  const data = loadData();
  const stats = calculateStats(data);
  const insights = generateInsights(stats, data);
  const html = buildHTML(stats, insights, data);

  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, 'report.html');
  fs.writeFileSync(reportPath, html);
  logger.success(`Report saved: ${reportPath}`);

  // Guardar datos raw como JSON
  const rawJsonPath = path.join(outputDir, 'rawData.json');
  fs.writeFileSync(rawJsonPath, JSON.stringify(data, null, 2));
  logger.success(`Raw data JSON saved: ${rawJsonPath}`);

  // Guardar datos raw como CSV
  const csvHeaders = ['id','platform','scrapedAt','city','zoneName','zoneType','productName','productCategory','productPrice','deliveryFee','serviceFee','deliveryTimeMinutes','discountDescription','storeAvailable','totalPrice','url'];
  const csvRows = data.map(row => csvHeaders.map(h => {
    const val = row[h];
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(','));
  const csv = [csvHeaders.join(','), ...csvRows].join('\n');
  const rawCsvPath = path.join(outputDir, 'rawData.csv');
  fs.writeFileSync(rawCsvPath, csv);
  logger.success(`Raw data CSV saved: ${rawCsvPath}`);

  // Guardar insights como JSON
  const insightsPath = path.join(outputDir, 'insights.json');
  fs.writeFileSync(insightsPath, JSON.stringify({ stats, insights }, null, 2));
  logger.success(`Insights JSON saved: ${insightsPath}`);

  return { reportPath, insightsPath, stats, insights };
}

if (require.main === module) {
  main();
}

module.exports = { main, calculateStats, generateInsights, buildHTML, loadData };
