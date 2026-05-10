/**
 * Dataset de 30 direcciones representativas en Mexico (CDMX, Monterrey, Guadalajara)
 * Criterios de seleccion:
 * - Cobertura geografica: 3 ciudades principales
 * - Diversidad socioeconomica: zonas alta, media, baja
 * - Densidad comercial: zonas con alta concentracion de restaurantes
 * - Zonas perifericas: para analizar gaps de cobertura
 * - Zonas universitarias: segmento joven con alta penetracion de apps
 */

const addresses = [
  // ================= CDMX (10 direcciones) =================
  {
    id: 'cdmx-01',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'alta',
    zoneName: 'Polanco',
    address: 'Av. Presidente Masaryk 123, Polanco, Miguel Hidalgo',
    lat: 19.434,
    lng: -99.188,
    justification: 'Zona de alto poder adquisitivo. Alto volumen de pedidos premium. Competencia intensa.'
  },
  {
    id: 'cdmx-02',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'alta',
    zoneName: 'Condesa',
    address: 'Calle Tamaulipas 100, Condesa, Cuauhtemoc',
    lat: 19.415,
    lng: -99.17,
    justification: 'Zona trendy con alta densidad de restaurantes. Publico joven y early adopters.'
  },
  {
    id: 'cdmx-03',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'media',
    zoneName: 'Coyoacan Centro',
    address: 'Av. Miguel Angel de Quevedo 123, Coyoacan',
    lat: 19.35,
    lng: -99.162,
    justification: 'Zona residencial de clase media con tradicion gastronomica. Mercado fidelizado.'
  },
  {
    id: 'cdmx-04',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'media',
    zoneName: 'Roma Norte',
    address: 'Calle Orizaba 50, Roma Norte, Cuauhtemoc',
    lat: 19.42,
    lng: -99.16,
    justification: 'Zona gentrificada con mix de residentes y oficinas. Alto trafico de pedidos lunch.'
  },
  {
    id: 'cdmx-05',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'baja',
    zoneName: 'Iztapalapa Centro',
    address: 'Calzada Ermita Iztapalapa 100, Iztapalapa',
    lat: 19.358,
    lng: -99.093,
    justification: 'Zona periferica densamente poblada. Precio sensitivo. Test de fees competitivos.'
  },
  {
    id: 'cdmx-06',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'baja',
    zoneName: 'Ecatepec (limite)',
    address: 'Av. Central 200, Ecatepec, Estado de Mexico',
    lat: 19.595,
    lng: -99.05,
    justification: 'Zona conurbada de ingresos medios-bajos. Evaluar disponibilidad de repartidores.'
  },
  {
    id: 'cdmx-07',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'turistica',
    zoneName: 'Centro Historico',
    address: 'Calle Francisco I. Madero 30, Centro Historico',
    lat: 19.432,
    lng: -99.133,
    justification: 'Zona turistica y comercial. Demanda mixta: oficinistas + turistas. Variabilidad de precios.'
  },
  {
    id: 'cdmx-08',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'universitaria',
    zoneName: 'Ciudad Universitaria',
    address: 'Av. Universidad 3000, Coyoacan',
    lat: 19.332,
    lng: -99.184,
    justification: 'UNAM - una de las universidades mas grandes de LATAM. Segmento joven, price-sensitive.'
  },
  {
    id: 'cdmx-09',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'corporativa',
    zoneName: 'Santa Fe',
    address: 'Av. Santa Fe 100, Santa Fe, Cuajimalpa',
    lat: 19.358,
    lng: -99.259,
    justification: 'Corredor corporativo mas importante de Mexico. Pedidos ejecutivos, alto ticket promedio.'
  },
  {
    id: 'cdmx-10',
    city: 'Ciudad de Mexico',
    state: 'CDMX',
    zoneType: 'residencial',
    zoneName: 'Tlalpan Centro',
    address: 'Calzada de Tlalpan 200, Tlalpan Centro',
    lat: 19.297,
    lng: -99.17,
    justification: 'Zona residencial de clase media-alta en el sur. Demanda familiar. Test de cobertura.'
  },

  // ================= Monterrey (10 direcciones) =================
  {
    id: 'mty-01',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'alta',
    zoneName: 'San Pedro Garza Garcia',
    address: 'Av. Vasconcelos 100, San Pedro Garza Garcia',
    lat: 25.648,
    lng: -100.4,
    justification: 'Municipio con mayor PIB per capita de Mexico. Mercado premium. Rappi vs Uber Eats fuerte competencia.'
  },
  {
    id: 'mty-02',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'alta',
    zoneName: 'Valle Oriente',
    address: 'Av. Lazaro Cardenas 1000, Valle Oriente, San Pedro',
    lat: 25.657,
    lng: -100.345,
    justification: 'Distrito corporativo y residencial de lujo. Alto poder adquisitivo. Demanda de retail y restaurantes.'
  },
  {
    id: 'mty-03',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'media',
    zoneName: 'Cumbres',
    address: 'Av. Paseo de los Leones 500, Cumbres, Monterrey',
    lat: 25.73,
    lng: -100.37,
    justification: 'Zona residencial consolidada de clase media-alta. Familias con alta penetracion de apps.'
  },
  {
    id: 'mty-04',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'media',
    zoneName: 'Centro Monterrey',
    address: 'Av. Padre Mier 100, Centro, Monterrey',
    lat: 25.671,
    lng: -100.309,
    justification: 'Centro historico y comercial. Mix de residentes, trabajadores y turistas. Demanda variada.'
  },
  {
    id: 'mty-05',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'baja',
    zoneName: 'Apodaca Centro',
    address: 'Av. Mexico 200, Apodaca',
    lat: 25.78,
    lng: -100.185,
    justification: 'Zona periferica industrial. Crecimiento poblacional reciente. Test de expansion de cobertura.'
  },
  {
    id: 'mty-06',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'baja',
    zoneName: 'Garcia',
    address: 'Av. Juarez 100, Garcia',
    lat: 25.81,
    lng: -100.595,
    justification: 'Municipio en crecimiento al norte. Zona price-sensitive. Evaluar competitividad de fees.'
  },
  {
    id: 'mty-07',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'turistica',
    zoneName: 'Fundidora',
    address: 'Av. Fundidora 501, Obrera, Monterrey',
    lat: 25.678,
    lng: -100.285,
    justification: 'Parque turistico y cultural. Alto flujo de visitantes. Demanda esporadica pero relevante.'
  },
  {
    id: 'mty-08',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'universitaria',
    zoneName: 'Tecnologico de Monterrey',
    address: 'Av. Eugenio Garza Sada 2501, Tecnologico, Monterrey',
    lat: 25.651,
    lng: -100.289,
    justification: 'ITESM - universidad elite. Estudiantes de alto poder adquisitivo. Segmento valioso.'
  },
  {
    id: 'mty-09',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'corporativa',
    zoneName: 'Santa Maria',
    address: 'Av. Vasconcelos 800, Santa Maria, Monterrey',
    lat: 25.69,
    lng: -100.36,
    justification: 'Zona corporativa con oficinas de multinacionales. Demanda de lunch ejecutivo.'
  },
  {
    id: 'mty-10',
    city: 'Monterrey',
    state: 'Nuevo Leon',
    zoneType: 'residencial',
    zoneName: 'San Jeronimo',
    address: 'Av. San Jeronimo 1000, San Jeronimo, Monterrey',
    lat: 25.66,
    lng: -100.35,
    justification: 'Zona residencial exclusiva. Alto poder adquisitivo. Mercado de delivery premium.'
  },

  // ================= Guadalajara (10 direcciones) =================
  {
    id: 'gdl-01',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'alta',
    zoneName: 'Andares',
    address: 'Blvd. Puerta de Hierro 4965, Zapopan',
    lat: 20.709,
    lng: -103.411,
    justification: 'Centro comercial de lujo mas importante de GDL. Zona residencial de alto poder adquisitivo.'
  },
  {
    id: 'gdl-02',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'alta',
    zoneName: 'Providencia',
    address: 'Av. Pablo Neruda 1000, Providencia, Guadalajara',
    lat: 20.7,
    lng: -103.39,
    justification: 'Zona residencial y gastronomica de clase alta. Alta densidad de restaurantes trendy.'
  },
  {
    id: 'gdl-03',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'media',
    zoneName: 'Zapopan Centro',
    address: 'Av. Hidalgo 100, Zapopan Centro',
    lat: 20.72,
    lng: -103.39,
    justification: 'Centro municipal de Zapopan. Mix de residentes locales y turistas. Demanda familiar.'
  },
  {
    id: 'gdl-04',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'media',
    zoneName: 'Centro Historico GDL',
    address: 'Av. 16 de Septiembre 100, Centro, Guadalajara',
    lat: 20.675,
    lng: -103.347,
    justification: 'Centro historico de GDL. Comercio, oficinas y turismo. Alta variabilidad de demanda.'
  },
  {
    id: 'gdl-05',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'baja',
    zoneName: 'Tonala',
    address: 'Av. Tonaltecas 200, Tonala',
    lat: 20.624,
    lng: -103.234,
    justification: 'Zona periferica artesanal e industrial. Crecimiento reciente. Price-sensitive.'
  },
  {
    id: 'gdl-06',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'baja',
    zoneName: 'El Salto',
    address: 'Av. Principal 100, El Salto',
    lat: 20.565,
    lng: -103.18,
    justification: 'Municipio periferico al sureste. Zona de expansion. Evaluar cobertura y disponibilidad.'
  },
  {
    id: 'gdl-07',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'turistica',
    zoneName: 'Tlaquepaque Centro',
    address: 'Av. Independencia 100, Tlaquepaque Centro',
    lat: 20.64,
    lng: -103.31,
    justification: 'Pueblo magico con alto flujo turistico. Demanda de comida tipica y retail.'
  },
  {
    id: 'gdl-08',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'universitaria',
    zoneName: 'UdeG Centro Universitario',
    address: 'Blvd. Gral. Marcelino Garcia Barragan 1421, Olimpica, Guadalajara',
    lat: 20.68,
    lng: -103.33,
    justification: 'Universidad de Guadalajara - principal universidad publica. Segmento estudiantil masivo.'
  },
  {
    id: 'gdl-09',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'corporativa',
    zoneName: 'Zona Industrial',
    address: 'Av. Lazaro Cardenas 1000, Zona Industrial, Guadalajara',
    lat: 20.66,
    lng: -103.32,
    justification: 'Zona industrial y corporativa. Demanda de lunch y retail para trabajadores.'
  },
  {
    id: 'gdl-10',
    city: 'Guadalajara',
    state: 'Jalisco',
    zoneType: 'residencial',
    zoneName: 'Bugambilias',
    address: 'Av. Paseo de la Arboleda 1000, Bugambilias, Zapopan',
    lat: 20.735,
    lng: -103.42,
    justification: 'Zona residencial consolidada de clase media-alta. Familias. Demanda recurrente.'
  },
];

function getAddresses(filter = {}) {
  let result = [...addresses];
  if (filter.city) result = result.filter(a => a.city === filter.city);
  if (filter.zoneType) result = result.filter(a => a.zoneType === filter.zoneType);
  if (filter.state) result = result.filter(a => a.state === filter.state);
  return result;
}

function getById(id) {
  return addresses.find(a => a.id === id);
}

function getStats() {
  const cities = [...new Set(addresses.map(a => a.city))];
  const zoneTypes = [...new Set(addresses.map(a => a.zoneType))];
  return {
    total: addresses.length,
    cities: cities.length,
    byCity: cities.map(c => ({ city: c, count: addresses.filter(a => a.city === c).length })),
    zoneTypes: zoneTypes.length,
    byZoneType: zoneTypes.map(z => ({ zoneType: z, count: addresses.filter(a => a.zoneType === z).length })),
  };
}

module.exports = { addresses, getAddresses, getById, getStats };
