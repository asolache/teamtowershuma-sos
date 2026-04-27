---
id: sop-teamtowers-merchandising
type: sop
soc_ref: soc-teamtowers-merchandising
brand_ref: soc-teamtowers-brand
version: v1
status: draft
author: "@alvaro"
items:
  - id: panuelo-casteller
    name: "Pañuelo casteller"
    customizable: true
    customization: ["logo bordado", "logo serigrafiado", "color base"]
  - id: faixa-castellera
    name: "Faixa castellera (faja)"
    customizable: true
    customization: ["logo bordado", "color personalizable"]
prerequisites:
  - "Confirmación de cantidades por producto."
  - "Logo en formato vectorial (SVG, AI, EPS) si hay personalización."
  - "Plazo mínimo de producción acordado con el cliente."
  - "Dirección de entrega y plazo de envío."
deliverables:
  - "Stock entregado en venue del evento o dirección del cliente"
  - "Factura con desglose por producto y personalización"
keywords: [merchandising, pañuelo, faixa, faja, branding, upsell, pedido, producción]
fmv_eur_h: null  # Catálogo con tarifas escalonadas por volumen. NO incluir en MD.
---

# Merchandising TeamTowers · SOP v1

> Procedimiento estándar para pedidos de merchandising castellero
> personalizable.

---

## Estructura del proceso

| Fase | Tiempo | Objetivo |
|---|---|---|
| 1 · Briefing | 30 min · 1 llamada | Definir productos, cantidades, personalización |
| 2 · Cotización | 1-2 días | Propuesta con tarifas escalonadas + plazos |
| 3 · Aprobación de arte | 2-5 días | Cliente aprueba muestra de logo + colores |
| 4 · Producción | 2-5 semanas | Plazo según volumen y complejidad |
| 5 · Entrega | 1-3 días | Entrega en venue o dirección del cliente |
| 6 · Facturación | Post-entrega | Factura emitida con conformidad de recepción |

Plazo total típico: **3-7 semanas** desde briefing a entrega. Pedidos
urgentes (<2 sem) sólo si hay stock genérico no personalizado.

---

## Fase 1 · Briefing (30 min)

Confirmar:
1. Productos solicitados y cantidades por producto.
2. Tipo de personalización (logo bordado / serigrafiado / sin logo).
3. Color base preferido.
4. Plazo objetivo de entrega (vinculado a fecha de evento si aplica).
5. Destino de entrega.
6. Si hay co-branding TeamTowers + cliente o sólo cliente.

Output: **brief firmado por sponsor o agencia**.

---

## Fase 2 · Cotización (1-2 días)

Propuesta con:
- Detalle por producto y cantidad.
- Tarifas escalonadas según volumen.
- Coste de personalización (si aplica).
- Plazo de producción.
- Coste de envío al destino.
- Validez de la cotización (30 días estándar).

Output: **cotización formal en MD/PDF**, persistida como
`type: deliverable kind: 'merch-quotation'` en SOS si el pedido está
asociado a un workshop.

---

## Fase 3 · Aprobación de arte (2-5 días)

- Cliente envía logo en formato vectorial.
- Equipo de diseño TeamTowers prepara mock-up.
- Aprobación por escrito antes de entrar a producción.
- Cualquier cambio post-aprobación tiene coste adicional.

Output: **mock-up firmado** + adelanto de pago si procede.

---

## Fase 4 · Producción (2-5 semanas)

- Producción según especificaciones aprobadas.
- Control de calidad de cada lote (tejido, color, bordado, etc.).
- En caso de defecto detectado, reposición sin coste para el cliente.

---

## Fase 5 · Entrega (1-3 días)

- Embalaje individualizado por producto.
- Entrega en venue del evento (vinculada a workshop) o dirección
  acordada.
- Albarán con conformidad de recepción.

---

## Fase 6 · Facturación

- Factura post-entrega con desglose por producto.
- Pago a 30 días estándar (o según contrato).
- Persistencia en SOS como `type: ledger_entry` en el proyecto del
  cliente cuando aplique.

---

## Variantes operativas

| Variante | Modulación |
|---|---|
| **Upsell post-taller** | Bloque opcional añadido a la propuesta del taller. Plazo coordinado con fecha del evento. |
| **Pedido independiente DMC** | Sin workshop asociado. Tarifa por volumen + envío directo a almacén DMC. |
| **Stock genérico para festivales** | Producto no personalizado. Plazo corto. Venta al público en eventos. |
| **Co-branding** | Logo cliente + simbolo casteller. Mock-up obligatorio. |
| **Internacional** | Suplemento de envío + posibles trámites aduaneros si fuera de UE. |

---

## Indicadores de éxito

| Dimensión | Verde | Ámbar | Rojo |
|---|---|---|---|
| Plazo cumplido | Entregado en fecha | 1-3 días tarde | >3 días |
| Calidad de personalización | Sin defectos | Defectos menores reportados | Defectos mayores |
| Margen del operador | ≥30% | 15-29% | <15% |
| Recompra en 12 meses | Cliente vuelve a pedir | Sólo recomienda | No vuelve |

---

## Conexión con SOS · Mind-as-Graph

| Output | Tipo de nodo | Cuándo |
|---|---|---|
| Brief | `deliverable` kind=`merch-brief` | Fase 1 |
| Cotización | `deliverable` kind=`merch-quotation` | Fase 2 |
| Mock-up aprobado | `signed_artifact` | Fase 3 |
| Pedido cerrado | `ledger_entry` | Fase 6 |

---

## TODOs

- [ ] Plantilla de mock-up estándar para acelerar fase 3.
- [ ] Acuerdos de proveedores de producción (no documentar en MD por
      confidencialidad).
- [ ] Política de mínimos por producto.

---

*SOP draft v1 · alineado con SOC `soc-teamtowers-merchandising` y*
*SOC-raíz `soc-teamtowers-brand`.*
