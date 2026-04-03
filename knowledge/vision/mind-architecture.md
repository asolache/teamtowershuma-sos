# SOS Mind Architecture — Vedanta Framework (Documento de Visión)

> Este documento es referencia filosófica, no prescripción técnica.
> Úsalo al tomar decisiones de arquitectura de alto nivel.

---

## La mente como modelo de SOS

El Vedanta describe la mente como cinco capas funcionales (Koshas). SOS V11 se organiza según este modelo: cada módulo técnico corresponde a una función cognitiva real, no es un artefacto arbitrario.

| Capa Vedanta | Función | Módulo SOS | Tipo de conocimiento |
|---|---|---|---|
| **Buddhi** (intuición/síntesis) | Visión estratégica, decisión | QueenSwarm · VNA Mapper | Tácito, emergente |
| **Manas** (intelecto/razonamiento) | Planificación, análisis | Orchestrator · PrimerEngine | Explícito, estructurado |
| **Chitta** (memoria/patrones) | Conocimiento acumulado | KB.js · /knowledge/ | Semántico, relacional |
| **Karma** (producción/acción) | Ejecución, entregables | WoGenerator · ArtifactEngine · Ledger | Procedimental |
| **Vak** (comunicación/relación) | Valor externo, stakeholders | VNA intangibles · Usenet | Social, contextual |

---

## Por qué esto importa técnicamente

### El grafo no son puntos desconectados

Cada nodo del ValueMap debe pertenecer a una capa cognitiva. La arquitectura fractal significa que:
- Un rol VNA no es solo una etiqueta — es una función cognitiva en la red
- Una transacción no es solo un flujo — pertenece a producción (Karma) o comunicación (Vak)
- El conocimiento en `/knowledge/` no es datos — es memoria activa (Chitta) que enriquece la intuición (Buddhi)

### Context-First sobre Multi-Agent

La implicación práctica del modelo Vedanta para SOS es esta: **la calidad de la intuición (Buddhi) depende de la riqueza de la memoria (Chitta)**. 

Tener 20 agentes con contexto vacío = intuición pobre.
Tener 1 llamada bien construida con contexto rico de `/knowledge/` = intuición potente.

Por esto V11 prioriza el `KnowledgeLoader.js` sobre la proliferación de agentes.

---

## El loop de aprendizaje

```
Usuario describe ecosistema
        ↓
KnowledgeLoader carga contexto relevante de /knowledge/
        ↓
Orchestrator construye llamada rica → Anthropic
        ↓
Artefacto VNA generado (alta calidad)
        ↓
ArtifactEngine persiste en KB.js
        ↓
Si genera conocimiento nuevo → se escribe en /knowledge/
        ↓
Próxima llamada tiene contexto aún más rico
```

---

## Aplicación al ValueMap

El grafo de V11 debe mostrar visualmente las capas cognitivas:
- Nodos de **síntesis/visión** (hexágonos, color índigo) — arriba
- Nodos de **producción** (rectángulos, color verde) — derecha
- Nodos de **comunicación** (círculos, color azul) — abajo
- **Memoria/conocimiento** (iconos de libro, color naranja) — fondo/base
- Flujos tangibles: líneas sólidas
- Flujos intangibles: líneas punteadas

Esto convierte el mapa en una representación real de la mente del ecosistema, no solo un diagrama de caja-flecha.

---

## Implicaciones para hardware limitado (Mac 2012)

El modelo Vedanta sugiere que la escasez de recursos computacionales se gestiona priorizando la capa correcta:

1. **Chitta (memoria) local** — `/knowledge/` en archivos MD, zero proceso
2. **Karma (producción) en la nube** — Anthropic API maneja el razonamiento pesado
3. **Buddhi (intuición) es emergente** — no requiere cómputo propio, emerge del contexto bien construido
4. **Local model (opcional)** — solo para tareas de clasificación/recuperación simples si se instala Ollama

---

*Documento de visión SOS V11 · No modificar sin consenso del Ecosystem Owner*
