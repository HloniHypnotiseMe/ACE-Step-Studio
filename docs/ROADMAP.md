# C6 Local AI Music Studio — Build Roadmap

## Phase 0 — Forensics
Goal: turn the supplied repositories into a verified capability map.

Deliverables:
- dependency inventory
- license inventory
- runtime matrix
- GPU matrix
- interface contracts
- reusable components
- gaps
- risks

## Phase 1 — Foundation
- establish project architecture
- isolate existing ACE-Step generation behind provider interface
- establish project format
- establish model manager
- establish AI worker process
- establish CI
- establish crash-safe logging

## Phase 2 — AI Music MVP
- prompt-to-song
- local lyrics/style
- batch variations
- generation history
- reference audio
- repaint/continuation
- export

## Phase 3 — StemDeck → DAW
- import audio
- stem extraction
- multitrack timeline
- waveform editing
- mute/solo/gain/pan
- project save/load
- render/export

## Phase 4 — Producer Core
- piano roll
- MIDI editing
- step sequencer
- quantize/groove
- drum patterns
- sample browser
- recording
- takes/comping

## Phase 5 — Professional Studio
- mixer
- routing/busses
- automation
- plugin hosting
- low-latency monitoring
- freeze/bounce
- offline render
- project recovery

## Phase 6 — AI Producer
- natural-language commands
- arrangement assistant
- MIDI generation
- drum variation
- vocal assistant
- mix assistant
- mastering assistant
- explain/preview/apply/revert for every AI operation

## Phase 7 — Distribution
- Windows installer
- macOS signed/notarized build
- model packs
- update system
- crash reporting with privacy controls
- App Store packaging where compatible
- direct installer fallback where required by model/plugin distribution constraints

## Phase 8 — Proprietary Moat
Only after product/usage validation:
- proprietary music planning models
- proprietary production assistant
- proprietary workflow intelligence
- optional fine-tuning on properly licensed/consented data
