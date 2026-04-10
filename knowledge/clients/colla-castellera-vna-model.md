---
project_name: "Castellers · VNA Live Demo"
client_id: "colla-castellera"
sector_id: "S"
sector_name: "Arts, Culture & Human Performance"
sector_name_en: "Arts, Culture & Human Performance"
version: "v11.1"
created_at: "2025-04-10T00:00:00.000Z"
tags: [castellers, vna-demo, human-tower, trust-network, performance]

roles:
  - id: baixos
    name: "Baixos — Ground Anchor"
    description: "Transmits all structural compression to the ground. The absolute foundation of the network. Every value flow in the system ultimately rests on this role."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Heaviest, most experienced castellers. Senior ops leads."
    tags: [foundation, anchor, structural, load-bearing]

  - id: crosses
    name: "Crosses — Axilla Brace"
    description: "Placed under the armpits of the Baixos. Prevents them from sinking under axial load. Communicates exclusively through touch — no verbal exchange possible."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Mid-weight castellers. Cross-functional support roles."
    tags: [brace, support, haptic-communication, silent]

  - id: contraforts
    name: "Contraforts — Back Pressure"
    description: "Positioned behind the Baixos. Absorbs rear pressure to maintain vertical alignment. Operates blind — cannot see the tower, only feel it through pressure."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Experienced castellers who trust without visibility. Backend ops."
    tags: [alignment, blind-trust, pressure, rear-support]

  - id: mans
    name: "Mans — Hip Stabilizers"
    description: "Pushes upward and stabilizes the gluteus and legs of upper floors. If stable, confidence propagates upward through the whole network. If they falter, panic cascades."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Mid-tier support roles. Team enablers."
    tags: [stabilizer, confidence, upward-push, cascade-prevention]

  - id: laterals
    name: "Laterals & Vents — Side Guard"
    description: "Secures the lateral flanks. Detects micro-sways before they become visible collapses. First line of early-warning in the network."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Risk monitors, quality assurance, lateral coordinators."
    tags: [lateral, oscillation, early-warning, risk-detection]

  - id: segons
    name: "Segons — 2nd Floor"
    description: "First visible level of the tower. Distributes weight geometrically. Provides the shoulder platform for the 3rd floor. The link between base and superstructure."
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "Mid-level managers, senior individual contributors."
    tags: [distribution, platform, tronc, bridge-role]

  - id: tercos
    name: "Terços — 3rd Floor"
    description: "Operating at significant height with increasing compression from above and decreasing support from below. Requires maximum cognitive focus — no bandwidth for anything beyond pure execution."
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "Senior specialists, technical leads operating under pressure."
    tags: [height, focus, compression, cognitive-load]

  - id: folre
    name: "Folre — Secondary Base"
    description: "A second pinya built over the primary one in complex castles. Absorbs lateral stress from the Segons. In organizational terms: the middle management layer that makes scaling possible without collapsing the base."
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "Department heads, scaling layer in large organizations."
    tags: [folre, secondary-support, scaling, complex-structure]

  - id: dosos
    name: "Dosos — Crown Base"
    description: "Two castellers forming the base of the final block. Provides the last stable platform before the apex. The emotional handoff zone — where technical execution meets psychological support."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "Senior advisors, executive sponsors, C-suite direct reports."
    tags: [crown, platform, emotional-handoff, near-apex]

  - id: acotxador
    name: "Acotxador — Safety Bridge"
    description: "Crouches (acotxat) on the Dosos. Provides the physical and emotional surface for the Enxaneta's final step. At maximum height and maximum vulnerability, eye contact and physical touch become the only intangible that matters."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "Executive coach, direct mentor, the person who makes the apex feel safe."
    tags: [safety, empathy, apex-support, emotional-anchor]

  - id: enxaneta
    name: "Enxaneta — The Apex"
    description: "The child who crowns the castle. Raises the arm (la aleta) — the single gesture that validates the entire network. Delivers collective catharsis to every node simultaneously. One person, maximum systemic impact."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "The product launch, the signed deal, the milestone that validates all prior effort."
    tags: [apex, validation, collective-catharsis, purpose]

  - id: cap-de-colla
    name: "Cap de Colla — Network Director"
    description: "The only node with full macroscopic visibility. Designs the network, gives real-time commands, and holds the authority to abort. In complex castles (folre+manilles) authority distributes to embedded organic leaders — centralized control becomes physically impossible."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "CEO, CTO, transformation lead. The one who sees the whole system."
    tags: [director, macroscopic-vision, distributed-authority, abort-authority]

  - id: musics
    name: "Músics — Network Clock"
    description: "The Grallers and Tabalers who play the Toc de Castells. Provide acoustic telemetry to nodes that cannot see. The melody signals exact phase to the Baixos who are blind to the apex. Synchronize breathing, focus and collective flow state across all nodes simultaneously."
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "Real-time dashboards, status broadcasts, the heartbeat of the organization's communication rhythm."
    tags: [telemetry, synchronization, acoustic, flow-state, rhythm]

transactions:
  - id: tx-baixos-to-segons
    from: baixos
    to: segons
    deliverable: "Structural compression platform — stable shoulders"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "If this flow is unstable, every level above is at risk. No recovery possible once it breaks."

  - id: tx-segons-to-baixos
    from: segons
    to: baixos
    deliverable: "Geometric weight distribution — equitable load"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Uneven weight distribution is invisible until collapse. VNA makes it measurable."

  - id: tx-baixos-to-segons-intangible
    from: baixos
    to: segons
    deliverable: "Psychological security — certainty that the foundation holds"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Without this intangible, the Segons cannot focus. Fear consumes cognitive bandwidth."

  - id: tx-crosses-to-baixos
    from: crosses
    to: baixos
    deliverable: "Axial load prevention — physical bracing"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "A crossa giving way 2mm generates cascade failure through the entire network."

  - id: tx-baixos-to-crosses
    from: baixos
    to: crosses
    deliverable: "Micro-pressure signals — haptic communication"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "No verbal exchange possible. If tactile communication breaks, the Crosses operate blind."

  - id: tx-segons-to-tercos
    from: segons
    to: tercos
    deliverable: "Shoulder platform — anchored ascent surface"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Platform instability at this transition doubles the cognitive load on the Terços."

  - id: tx-segons-to-tercos-intangible
    from: segons
    to: tercos
    deliverable: "Biomechanical confidence — calm transmitted upward"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "If the Segons tremble, panic propagates upward instantly. Confidence is contagious in both directions."

  - id: tx-tercos-to-dosos
    from: tercos
    to: dosos
    deliverable: "Upper platform — stable base for crown"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "At this height, any instability is amplified. Small deviations become large sways."

  - id: tx-dosos-to-acotxador
    from: dosos
    to: acotxador
    deliverable: "Final physical platform — stable surface at apex"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "The last tangible handoff before the summit. No second chances."

  - id: tx-acotxador-to-enxaneta
    from: acotxador
    to: enxaneta
    deliverable: "Back surface — physical step to the apex"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "The most visible transaction in the network. Failure here is public."

  - id: tx-acotxador-to-enxaneta-intangible
    from: acotxador
    to: enxaneta
    deliverable: "Empathy at altitude — eye contact that eliminates vertigo"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "At maximum height and maximum vulnerability, this intangible is the only thing preventing paralysis."

  - id: tx-enxaneta-to-network
    from: enxaneta
    to: cap-de-colla
    deliverable: "La Aleta — the raised arm that validates the entire network"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "This single gesture delivers value to every node simultaneously. One action, systemic impact."

  - id: tx-enxaneta-catharsis
    from: enxaneta
    to: baixos
    deliverable: "Collective catharsis — simultaneous tension release across all nodes"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "The purpose that justifies every tangible sacrifice. Without it, the network loses its reason to exist."

  - id: tx-cap-to-tronc
    from: cap-de-colla
    to: segons
    deliverable: "Operational commands — timing, phase signals, abort decisions"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "In complex castles (folre+manilles) the Cap cannot see the core. Authority must distribute to embedded organic leaders or the network becomes unmanageable."

  - id: tx-cap-to-network-intangible
    from: cap-de-colla
    to: baixos
    deliverable: "Macroscopic vision — the only node that sees the whole system"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "If the Cap loses confidence or visibility, every node feels it. The network reads its director's emotional state."

  - id: tx-musics-to-baixos
    from: musics
    to: baixos
    deliverable: "Acoustic telemetry — melody signals exact Enxaneta phase to nodes that cannot see"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "The Baixos are blind to the apex. Without acoustic telemetry, they cannot know when to hold or release."

  - id: tx-musics-to-network-intangible
    from: musics
    to: tercos
    deliverable: "Group flow state — synchronized breathing, focus and collective motivation"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Rhythm synchronizes the entire network's nervous system. Without it, individuals optimize locally and the system breaks."

  - id: tx-folre-to-segons
    from: folre
    to: segons
    deliverable: "Exoskeletal bracing — prevents leg/knee collapse under compression"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Only present in complex castles. When scaling requires folre, its absence makes the structure impossible."

  - id: tx-folre-to-tercos-intangible
    from: folre
    to: tercos
    deliverable: "Cognitive focus unlock — by eliminating collapse risk, frees 100% mental bandwidth for execution"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "The paradox of scaling: adding a layer (folre) actually increases the cognitive capacity of existing layers."

  - id: tx-laterals-to-network
    from: laterals
    to: baixos
    deliverable: "Early-warning oscillation detection — sway signals before visible collapse"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "They feel micro-sways 2-3 seconds before they become visible. The earliest signal in the system."

  - id: tx-mans-to-tercos
    from: mans
    to: tercos
    deliverable: "Upward stabilization — distributed calm that travels through the structure"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Confidence is contagious. Steady Mans mean steady upper floors. Nervous Mans cascade panic upward."

patterns:
  - name: "Cascade failure from one broken intangible"
    description: "A Crossa giving way 2mm — one broken trust link — generates full network collapse. In organizations: one team losing psychological safety propagates fear upward and sideways."
    signal: "tx-crosses-to-baixos health score drops. Watch for it before it reaches tx-baixos-to-segons."

  - name: "Distributed authority at scale"
    description: "In folre+manilles castles, the Cap de Colla physically cannot see the core. Authority must distribute to organic leaders embedded in each layer. Organizations that don't distribute authority when scaling break exactly like castles that try to centralize at complexity."
    signal: "Cap de Colla has high outgoing tangibles but no reciprocal intangibles from inner layers. The network is deaf to the director."

  - name: "Intangibles as prerequisites"
    description: "Physical strength (tangible) collapses instantly without trust and rhythmic synchronization (intangible). The intangibles are not nice-to-have — they are the load-bearing structure of the tangibles."
    signal: "High tangible flow, low intangible flow. The network looks productive but is one trust failure away from collapse."

  - name: "Acoustic telemetry gap"
    description: "When the Músics are absent or misaligned, the Baixos operate blind to the apex state. In organizations: when real-time status communication breaks, the base makes decisions on stale information."
    signal: "tx-musics-to-baixos frequency drops. Base nodes begin operating on assumption rather than signal."

  - name: "The paradox of adaptive rigidity"
    description: "In extreme castles, Manilles must not be rigid — they must breathe with the castle, yielding millimetrically. Excess rigidity breaks the upper structure. The optimal flow is elastic containment, not brute force."
    signal: "Manilles reporting high tangible effort but high error rate. The problem is not strength, it is adaptive intelligence."
---

## Live Demo Notes

This VNA map of a Castellers human tower is TeamTowers' live demonstration case. It proves that Value Network Analysis applies to any human organization — from a 200-year-old Catalan tradition to a Fortune 500 corporation.

### Three business insights for C-suite audiences

**1. Intangibles are prerequisites, not bonuses**
Every tangible in this map — the physical support, the structural platform, the load distribution — collapses without its corresponding intangible. Trust, confidence, and rhythmic synchronization are not soft extras. They are the load-bearing infrastructure of the tangibles. Your org chart only shows the tangibles.

**2. One broken link cascades through the entire system**
A Crossa giving way 2mm generates full network collapse. In your organization: one team losing psychological safety, one knowledge transfer that never happened, one trust relationship that broke without anyone noticing — these propagate exactly the same way. VNA makes these vulnerabilities visible before they become crises.

**3. Leadership must distribute as complexity grows**
In castles requiring folre and manilles, the Cap de Colla physically cannot see the core of the structure. The network is forced to distribute authority to organic leaders embedded in each layer. Every organization that scales faces this exact moment. VNA shows you who the real decision nodes are — and whether authority has distributed to the right ones.

### The organizational parallel

| Castellers role | Organizational equivalent |
|---|---|
| Baixos | Core operations / infrastructure team |
| Crosses | Cross-functional support / enablement |
| Folre | Middle management scaling layer |
| Terços | Senior specialists under delivery pressure |
| Cap de Colla | CEO / transformation lead |
| Músics | Real-time dashboards / status communication |
| Enxaneta | The product launch / milestone / signed deal |
| La Aleta | The metric that validates all prior investment |
