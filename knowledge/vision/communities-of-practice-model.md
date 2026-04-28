---
id: vision-communities-of-practice
type: vision
version: v0.1
status: stub
author: "@alvaro"
purpose: "Formalizar el concepto de Comunidad de Práctica (CoP) en SOS V11 como capa social asociada a roles VNA, agrupable por ámbito (sector / dominio / folksonomía). Para Ola 3."
keywords: [comunidad-practica, cop, vna, rol, ambito, sector, folksonomia, social, learning]
sos_context: secondary
---

# Comunidades de Práctica · Modelo conceptual (Ola 3)

> Stub inicial — formaliza la conexión rol VNA ↔ CoP ↔ ámbito.
> Implementación UI pendiente (H9.x en backlog Ola 3).

---

## Por qué existen las CoPs en SOS

Las **redes de valor con propósito** (Verna Allee) trascienden a las
organizaciones individuales. Un mismo **rol VNA** —por ejemplo
*"acotxador invisible"* o *"músic"*— aparece en empresas distintas
de sectores distintos. Las personas que ocupan un rol determinado
necesitan aprender de y con otras que ocupan el mismo rol en otros
contextos.

Las **Comunidades de Práctica** (CoPs) son ese espacio social.
Inspiración: el espíritu de **43things** (gente conectada por
pasiones e intenciones compartidas) y el formato Usenet por hilos
asíncronos.

---

## Conceptos clave

### Rol VNA universal vs. rol VNA en proyecto

- En un proyecto concreto, un `vna_role` está acotado al cliente.
- Un **rol VNA universal** es la abstracción que cruza proyectos:
  "Cap de colla", "Acotxador", "Músic", "Diseñador de cartera de
  servicios", etc.

Cuando un usuario participa en SOS, sus roles VNA en distintos
proyectos pueden mapearse a roles universales que tienen una CoP
asociada.

### CoP

```yaml
type: cop
id: cop-{slug}
name: "Comunidad de Acotxadors invisibles"
universal_role_ref: role-acotxador
scope:
  ambit_kind: sector | domain | folksonomy
  ambit_id: 'F' | 'transformacion-digital' | 'cooperacion-publico-privada'
practice_calendar: [...]    # plan de actividades
member_count: int
sops_shared: ['sop-...']    # SOPs validados por la comunidad
```

### Ámbito (scope)

Las CoPs se agrupan por:

- **Sector CNAE**: ej. CoP "Acotxadors en Construcción" (`F`).
- **Dominio funcional**: ej. CoP "Acotxadors en Transformación Digital".
- **Folksonomía**: tags emergentes de la comunidad (ej. "post-crisis",
  "ciudades pequeñas", "fundaciones"). Permite agrupaciones
  transversales que escapan a CNAE.

Una persona puede pertenecer a varias CoPs simultáneamente.

---

## Conexión con SOPs

Las CoPs validan SOPs:

- Un SOP escrito por un usuario individual queda como `status: draft`.
- Si la CoP del rol asociado lo revisa y ratifica, pasa a
  `status: approved-by-cop-{slug}`.
- Esto enriquece el `KnowledgeLoader`: cuando una IA construye
  contexto para un proyecto, puede priorizar SOPs validados por la
  CoP del rol relevante.

---

## Conexión con la Matrix incubadora (futuro)

La **Matrix** (proyecto teamtowers.eu/matrix, Ola 3) usará las CoPs
como sistema de aprendizaje continuo: cada residente desarrolla
roles VNA reales en proyectos custom y, paralelamente, participa en
CoPs por su rol — aprende haciendo, comparte SOPs, recibe feedback.

---

## Plan de actividades

Cada CoP tiene un calendario editorial:

- **Ritual fijo**: ej. encuentro mensual asíncrono (hilos abiertos).
- **Eventos puntuales**: workshops cortos, masterclasses,
  retrospectivas de proyectos compartidos.
- **Proyectos colaborativos**: SOPs que se construyen entre miembros
  de varios proyectos cliente.

Estas actividades alimentan deliverables firmados que la CoP
publica como recursos abiertos (futuro permaweb · BACK-004).

---

## TODOs vivos

- [ ] Definir la estructura `universal_role_ref` (¿catálogo cerrado
      o emergente?). Probable: emergente con consolidación periódica
      por @alvaro.
- [ ] Decidir hosting de la parte online (Pocketbase / Supabase /
      Netlify Functions + DB ligera). Es la única pieza que requiere
      conexión; el resto del SOS sigue local-first.
- [ ] Inspiración 43things: qué partes adoptamos (matchmaking por
      intención compartida) y qué descartamos.
- [ ] Conexión con la franquicia de formación VNA (BACK-007 startup
      foco): cada formador certificado anima al menos una CoP.

---

*Stub v0.1 · pendiente desarrollo Ola 3.*
