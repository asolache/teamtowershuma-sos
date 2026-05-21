# LLM local training · v146

> Guia pràctica per a executar LLM locals + entrenar fine-tunes amb el teu
> propi knowledge SOS · adaptat al hardware del @alvaro (Mac mid-2012 ·
> 6GB RAM · macOS 10.15.8) i alternatives cloud.

## TL;DR · 3 capes

| Capa | Què | Hardware | Cost |
|---|---|---|---|
| **A · Inference local** | Córrer un model open-weight existent · respondre prompts | Mac 2012 OK amb models 3B quantitzats | Gratis |
| **B · Few-shot context** | Injectar fragments del teu KB al prompt sense fine-tune | Qualsevol | API normal |
| **C · Fine-tune real** | Entrenar adapter LoRA amb el teu dataset | **GPU obligatori** (cloud o local M-series) | 5-30€ per run |

**Recomanació @alvaro** · comença amb A+B (inference local + context · zero cost extra). C ho fas a cloud quan vulguis un agent "estil teu".

## Capa A · inference local amb Ollama

### Instal·lació

```bash
# macOS
brew install ollama
ollama serve &     # corre HTTP a localhost:11434

# Pull primer model · qwen2.5:3b ràpid + suficient per a tasks small-tier
ollama pull qwen2.5:3b
```

### Models suggerits per a Mac mid-2012 (6GB RAM · CPU-only)

| Model | Size | RAM | Velocitat | Ús |
|---|---:|---:|---|---|
| `qwen2.5:3b` | 1.9GB | 4GB | ràpid | classify · ner · small extracts |
| `phi3:mini` | 2.3GB | 4GB | ràpid | instruct · raonament petit |
| `llama3.2:3b` | 2.0GB | 4GB | mig | general · context 8k |
| `gemma2:2b` | 1.6GB | 4GB | molt ràpid | classify · molt curt |
| `qwen2.5:7b` | 4.7GB | 8GB | lent (Mac 2012) | general mid quality |

> **Atenció** · 7B en CPU Mac 2012 generarà 2-5 tokens/s · útil només per a
> tasks petits. 3B és el sweet-spot.

### Ús des de SOS

`js/core/ollamaProvider.js` (v146) permet usar Ollama com a provider del
benchmark · harness · o qualsevol fluxe SOS ·

```js
import { makeOllamaProvider } from './js/core/ollamaProvider.js';
const provider = makeOllamaProvider({ defaultModel: 'qwen2.5:3b' });
// Usable a runQualityHarness · runABTest · qualsevol consumer
```

CLI ·
```bash
# Comprovar que Ollama corre + llistar models
node -e "import('./js/core/ollamaProvider.js').then(m => m.ollamaHealthCheck().then(console.log))"
node -e "import('./js/core/ollamaProvider.js').then(m => m.ollamaListModels().then(console.log))"
```

## Capa B · few-shot context (sense entrenament)

Sense fine-tune · pots aconseguir un "agent estil teu" injectant fragments
del teu KB al system prompt. SOS ja ho fa per al domain pack (v145) ·
pots fer-ho equivalent per a skills.

Exemple ·
```js
const myStyle = `Skills declarades del client ·
${(await KB.query({ type: 'skill' })).slice(0, 5).map(s => '· ' + s.content.title + ' · ' + s.content.description).join('\n')}

WOs recents executades ·
${(await KB.query({ type: 'work_order' })).slice(0, 3).map(w => '· ' + w.content.title).join('\n')}

Usa aquest estil i registre quan responguis.`;
```

Cost · 0€ extra · només tokens injectats al prompt (+200-500 tokens / call).

## Capa C · fine-tune real (cloud GPU obligatori)

### Pas 1 · exportar dataset des de SOS

```bash
node scripts/export-training-dataset.mjs --format chatml --max 500
# → docs/training/dataset-chatml-<ts>.jsonl  (data)
# → docs/training/dataset-chatml-<ts>.jsonl.meta.json  (stats)
```

3 formats suportats ·
- `alpaca` · LoRA-friendly · `{instruction, input, output}`
- `chatml` · OpenAI / Anthropic / Mistral · `{messages:[{role,content}]}`
- `sharegpt` · Axolotl-friendly · `{conversations:[{from,value}]}`

### Pas 2 · entrenar a cloud GPU

| Plataforma | Cost approx | Ús |
|---|---|---|
| **Together AI** | $5-15 / run | API senzilla · upload JSONL · click train · 2-4h |
| **Modal** | $3-10 / run | Python script · més control |
| **RunPod** | $0.50/h · GPU H100 80GB | Self-hosted · més curva aprenentatge |
| **HuggingFace AutoTrain** | $4-20 / run | UI · llamà 3B-7B suportat |
| **OpenAI fine-tune** | $0.008/1k tokens | Només GPT-4o-mini/GPT-3.5 · no open-weight |

**Recomanació @alvaro** · Together AI · puja el `.jsonl` · 500-1000 samples ·
`qwen2.5-7b` o `mistral-7b` · 3 epochs · ~$8 · 2h. Output · LoRA adapter
o full model · descarregar i pujar a Ollama com a `ollama create` Modelfile.

### Pas 3 · usar el fine-tune a SOS

Si el cloud t'ha tornat un `.gguf` o LoRA convertible ·

```bash
# Convertir LoRA a Modelfile Ollama
ollama create sos-alvaro -f Modelfile     # Modelfile · FROM qwen2.5:7b · ADAPTER ./adapter.gguf

# Usar-lo al SOS
node -e "import('./js/core/ollamaProvider.js').then(m => m.ollamaGenerate({ model: 'sos-alvaro', userPrompt: 'Hello' }).then(r => console.log(r.text)))"
```

## Capa D · per què NO Mac 2012 per a fine-tune

- GPU GeForce GT 650M · 512MB VRAM · suficient només per a inference de
  models molt petits (< 1B) · NO per a backprop
- macOS 10.15.8 · sense suport CUDA modern · sense Apple MLX (requereix
  M-series + macOS 13.4+)
- 6GB RAM · ni tan sols permet quantize_4bit d'un 3B model durant training
- Veredict · fine-tune local **impossible** · cloud és l'única via

## Capa E · roadmap d'evolució

| Sprint | Què | Cost · temps |
|---|---|---|
| ✅ v146 (DONE) | Ollama provider + dataset builder + doc | 0€ |
| v147 | UI Settings · "🦙 LLM local" amb URL + model picker + test connexió | 0€ |
| v148 | Auto-fallback · si call API normal falla · prova local Ollama | 0€ |
| v149 | Wizard cloud-fine-tune · 1-click export + Together AI auto-upload | 0€ codi · 5-15€ runtime |
| v150 | Permaweb skill marketplace · puja el teu LoRA per a que altres l'usin | 0€ + Arweave fee |

## Privacy + leakage

- El dataset exportat NO conté claus API · només contingut KB públic
- Revisa el JSONL abans de pujar a cloud · cap PII per a evitar abusos
- Cloud GPU providers · OPT-OUT de "use my data" si l'opció existeix
  (Together · Modal · RunPod ja ho fan per defecte · OpenAI NO)
- Local fine-tune (cloud GPU dedicat · ex RunPod) · sense leakage · destrueix
  la instància post-training

---

*Doc v146 · 2026-05-21. Adaptat a hardware @alvaro (Mac mid-2012 · 6GB RAM ·
macOS 10.15.8). Pròxima revisió v149 (wizard cloud-fine-tune).*
