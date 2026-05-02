// =============================================================================
// TEAMTOWERS SOS V11 — CNAE 2009 SEED (MKT-001 sprint A)
// Ruta: /js/core/cnaeSeed.js
//
// Semilla reducida de códigos CNAE 2009 (España · Eurostat NACE Rev. 2)
// a 4 dígitos. No es exhaustiva (≈996 códigos completos · serían >50KB
// embedded). Cubre los grupos más relevantes para los sectores TT (A-Z)
// y se usa como autocomplete del buscador del Mercado SOS. Si el usuario
// teclea un código no listado, se acepta como free text válido.
//
// Estructura: { code: { name, group, sectorTT? } }
// - code:    string '4 dígitos'
// - name:    nombre legible en ES (puede ampliarse a EN)
// - group:   sección CNAE (A-S) · letra del nivel superior
// - sectorTT: letra del catálogo TeamTowers a la que mapea (opcional)
// =============================================================================

export const CNAE_SEED = Object.freeze({
    // A · Agricultura, ganadería, silvicultura y pesca → sector A
    '0111': { name: 'Cultivo de cereales (excepto arroz)',           group: 'A', sectorTT: 'A' },
    '0119': { name: 'Otros cultivos no perennes',                    group: 'A', sectorTT: 'A' },
    '0150': { name: 'Producción agrícola combinada con la ganadera', group: 'A', sectorTT: 'A' },
    '0210': { name: 'Silvicultura y otras actividades forestales',   group: 'A', sectorTT: 'A' },
    '0312': { name: 'Pesca en agua dulce',                           group: 'A', sectorTT: 'A' },

    // C · Industria manufacturera → sectores C, D, E (industria pesada · ligera · alimentaria)
    '1011': { name: 'Procesado y conservación de carne',             group: 'C', sectorTT: 'C' },
    '1071': { name: 'Fabricación de pan y productos frescos panad.', group: 'C', sectorTT: 'C' },
    '1392': { name: 'Fabricación de artículos confeccionados textil',group: 'C', sectorTT: 'C' },
    '1610': { name: 'Aserrado y cepillado de madera',                group: 'C', sectorTT: 'C' },
    '2511': { name: 'Fabricación de estructuras metálicas',          group: 'C', sectorTT: 'C' },
    '2620': { name: 'Fabricación de ordenadores y equipos periféricos', group: 'C', sectorTT: 'K' },
    '2790': { name: 'Fabricación de otro material y equipo eléctrico', group: 'C', sectorTT: 'C' },
    '3320': { name: 'Instalación de máquinas y equipos industriales',group: 'C', sectorTT: 'C' },

    // F · Construcción → sector F
    '4110': { name: 'Promoción inmobiliaria',                         group: 'F', sectorTT: 'F' },
    '4121': { name: 'Construcción de edificios residenciales',        group: 'F', sectorTT: 'F' },
    '4211': { name: 'Construcción de carreteras y autopistas',        group: 'F', sectorTT: 'F' },
    '4321': { name: 'Instalaciones eléctricas',                       group: 'F', sectorTT: 'F' },
    '4332': { name: 'Instalación de carpintería',                     group: 'F', sectorTT: 'F' },

    // G · Comercio al por mayor y al por menor → sector G
    '4519': { name: 'Venta de otros vehículos de motor',              group: 'G', sectorTT: 'G' },
    '4711': { name: 'Comercio al por menor con predominio alimentación', group: 'G', sectorTT: 'G' },
    '4759': { name: 'Comercio al por menor de muebles y aparatos hogar', group: 'G', sectorTT: 'G' },
    '4771': { name: 'Comercio al por menor de prendas de vestir',     group: 'G', sectorTT: 'G' },
    '4791': { name: 'Comercio al por menor por correspondencia o internet', group: 'G', sectorTT: 'G' },

    // H · Transporte y almacenamiento → sector H
    '4941': { name: 'Transporte de mercancías por carretera',         group: 'H', sectorTT: 'H' },
    '5210': { name: 'Depósito y almacenamiento',                      group: 'H', sectorTT: 'H' },
    '5320': { name: 'Otras actividades postales y de mensajería',     group: 'H', sectorTT: 'H' },

    // I · Hostelería → sector I
    '5510': { name: 'Hoteles y alojamientos similares',               group: 'I', sectorTT: 'I' },
    '5610': { name: 'Restaurantes y puestos de comidas',              group: 'I', sectorTT: 'I' },
    '5630': { name: 'Establecimientos de bebidas',                    group: 'I', sectorTT: 'I' },

    // J · Información y comunicaciones → sector J · K (tech)
    '5811': { name: 'Edición de libros',                              group: 'J', sectorTT: 'J' },
    '5829': { name: 'Edición de otros programas informáticos',        group: 'J', sectorTT: 'K' },
    '6010': { name: 'Actividades de radiodifusión',                   group: 'J', sectorTT: 'J' },
    '6201': { name: 'Actividades de programación informática',        group: 'J', sectorTT: 'K' },
    '6202': { name: 'Actividades de consultoría informática',         group: 'J', sectorTT: 'K' },
    '6311': { name: 'Proceso de datos · hosting · actividades relacionadas', group: 'J', sectorTT: 'K' },
    '6312': { name: 'Portales web',                                   group: 'J', sectorTT: 'K' },

    // K · Actividades financieras y de seguros → sector L
    '6419': { name: 'Otra intermediación monetaria',                  group: 'K', sectorTT: 'L' },
    '6630': { name: 'Actividades de gestión de fondos',               group: 'K', sectorTT: 'L' },

    // L · Actividades inmobiliarias → sector M
    '6810': { name: 'Compraventa de bienes inmobiliarios por cuenta propia', group: 'L', sectorTT: 'M' },
    '6820': { name: 'Alquiler de bienes inmobiliarios por cuenta propia',    group: 'L', sectorTT: 'M' },

    // M · Actividades profesionales, científicas y técnicas → sector N · O
    '6920': { name: 'Actividades de contabilidad, auditoría y asesoría', group: 'M', sectorTT: 'N' },
    '7022': { name: 'Otras actividades de consultoría de gestión empresarial', group: 'M', sectorTT: 'N' },
    '7111': { name: 'Servicios técnicos de arquitectura',             group: 'M', sectorTT: 'O' },
    '7112': { name: 'Servicios técnicos de ingeniería',               group: 'M', sectorTT: 'O' },
    '7311': { name: 'Agencias de publicidad',                         group: 'M', sectorTT: 'P' },
    '7320': { name: 'Estudio de mercado y opinión pública',           group: 'M', sectorTT: 'P' },
    '7410': { name: 'Actividades de diseño especializado',            group: 'M', sectorTT: 'P' },

    // N · Actividades administrativas y servicios auxiliares → sector P
    '7820': { name: 'Empresas de trabajo temporal',                   group: 'N', sectorTT: 'P' },
    '8121': { name: 'Limpieza general de edificios',                  group: 'N', sectorTT: 'P' },

    // P · Educación → sector Q
    '8520': { name: 'Educación primaria',                             group: 'P', sectorTT: 'Q' },
    '8531': { name: 'Educación secundaria general',                   group: 'P', sectorTT: 'Q' },
    '8542': { name: 'Educación universitaria',                        group: 'P', sectorTT: 'Q' },
    '8559': { name: 'Otra educación n.c.o.p. (formación, coaching)',  group: 'P', sectorTT: 'Q' },

    // Q · Actividades sanitarias y de servicios sociales → sector R · S
    '8610': { name: 'Actividades hospitalarias',                      group: 'Q', sectorTT: 'R' },
    '8621': { name: 'Actividades de medicina general',                group: 'Q', sectorTT: 'R' },
    '8810': { name: 'Servicios sociales sin alojamiento personas mayores', group: 'Q', sectorTT: 'S' },

    // R · Actividades artísticas, recreativas y de entretenimiento → sector T
    '9001': { name: 'Artes escénicas',                                group: 'R', sectorTT: 'T' },
    '9311': { name: 'Gestión de instalaciones deportivas',            group: 'R', sectorTT: 'T' },
    '9312': { name: 'Actividades de los clubes deportivos',           group: 'R', sectorTT: 'T' },

    // S · Otros servicios → sector UV
    '9412': { name: 'Actividades de organizaciones profesionales',    group: 'S', sectorTT: 'UV' },
    '9499': { name: 'Otras actividades asociativas n.c.o.p.',         group: 'S', sectorTT: 'UV' },
});

// Búsqueda por texto (código o nombre) con normalización ligera.
// Devuelve array de { code, ...meta } ordenado por relevancia (prefix match primero).
export function searchCnae(query, limit = 20) {
    const q = (query || '').toString().trim().toLowerCase();
    if (!q) return [];
    const entries = Object.entries(CNAE_SEED).map(([code, meta]) => ({ code, ...meta }));
    const matches = [];
    for (const e of entries) {
        const hay = (e.code + ' ' + e.name + ' ' + (e.sectorTT || '')).toLowerCase();
        if (e.code.startsWith(q))      matches.push({ entry: e, rank: 0 });
        else if (e.name.toLowerCase().startsWith(q)) matches.push({ entry: e, rank: 1 });
        else if (hay.includes(q))      matches.push({ entry: e, rank: 2 });
    }
    matches.sort((a, b) => a.rank - b.rank);
    return matches.slice(0, limit).map(m => m.entry);
}

export function getCnae(code) {
    if (!code) return null;
    const entry = CNAE_SEED[code];
    return entry ? { code, ...entry } : null;
}
