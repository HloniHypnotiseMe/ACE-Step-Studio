# Reverse Engineering Matrix — Existing C6 Music Stack

## Principle
Start with the desired end-state, then inspect existing repositories for reusable capabilities. We reverse engineer interfaces, data flows, dependency boundaries, UX patterns and implementation techniques. We do not copy proprietary code or bypass access controls.

## Source repositories

| Repository | Intended role |
|---|---|
| ACE-Step-Studio | Existing local music-generation studio; primary bootstrap candidate |
| stemdeck | Local stem separation + multitrack playback/export patterns |
| fish-speech | TTS/voice generation capability; license gate required |
| OmniVoice | Voice stack research/integration candidate |
| VoxCPM | Voice/TTS research candidate |
| GPT-SoVITS | Voice conversion/research candidate |
| F5-TTS | TTS candidate |
| chatterbox | Voice/TTS candidate |
| Voice-Recorder | Recording/input UX and capture patterns |
| WiFiAudioStreaming-Desktop | Audio transport/streaming research |
| SunoSongsCreator | External service workflow research only; not a runtime dependency |
| Suno-API | External service/API research only; not a runtime dependency |
| suno_ai_meta_tags_guide | Prompt/style metadata research |
| tunee_ai | Music workflow/model research |
| audiobook_maker | Long-form voice/audio pipeline research |
| transcribe-anything | Transcription/lyrics/audio analysis research |
| voicetypr | Voice workflow research |
| Antra | Audio/AI capability research |
| Fast-FoundationStereo | Visual capability research; future music-video/creative expansion |
| IDAssist | Identity/metadata workflow research |
| ghidra | Reverse-engineering tooling only; no product runtime dependency |
| skills | Agent workflow/skill infrastructure research |
| reverse-skill | Reverse-engineering workflow research |
| superpowers | Engineering workflow/orchestration research |

## Capability map

### Generation
- Full song: ACE-Step stack.
- Variations/repaint/reference: ACE-Step capabilities.
- Prompt enrichment: local LLM + metadata pipeline.

### Audio
- Stem separation: StemDeck/Demucs lineage.
- Recording: Voice-Recorder patterns.
- Timeline/multitrack: StemDeck patterns become product-native DAW components.
- Streaming/transport: WiFiAudioStreaming-Desktop research.

### Voice
- TTS/voice: Fish Speech, F5-TTS, GPT-SoVITS, Chatterbox, VoxCPM, OmniVoice.
- Transcription: transcribe-anything.
- Voice profiles: product-owned abstraction; authorized source recordings only.

### Agent layer
- skills/reverse-skill/superpowers inform development automation and QA, not end-user runtime assumptions.

## Required forensic output for each source
EXISTS / WORKS / VERIFIED:
- What it actually contains.
- What can be executed.
- Inputs/outputs.
- Runtime/dependency requirements.
- License.
- GPU/CPU requirements.
- Reusable interface.
- Integration risk.
- Replaceable adapter required.
