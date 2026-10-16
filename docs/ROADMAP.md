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


## Cross-cutting release gates (must close before calling the desktop product production-ready)

- [ ] Hardware detection integration tests on Windows NVIDIA, AMD ROCm, Apple Silicon, and CPU-only hosts; never infer VRAM from a device name.
- [ ] Runtime readiness uses provider-specific health contracts. A reachable HTTP server or a 404 response is not proof that a model can generate audio.
- [ ] Model manifests are populated only from reviewed sources with separate code/weights licenses, hashes, provenance, backend requirements, and commercial redistribution decisions.
- [ ] Asset lineage persists across project save/load/export/import and records provider, model/version when known, task, parameters, parent assets, and license-verification state.
- [ ] AI job lifecycle: progress, cancellation, timeout, retry policy, bounded concurrency, worker crash recovery, and no orphaned processes.
- [ ] Runtime process manager: configurable executable/arguments/working directory, environment allowlist, startup/shutdown, health checks, logs, and graceful failure. Never accept arbitrary command strings from the UI.
- [ ] Project safety: schema migrations, atomic saves/backups, missing-media relinking, package size limits, archive/path traversal protection, and corrupted-project recovery.
- [ ] Audio correctness: resampling, sample-accurate transport, loop/seek/pause correctness, clipping protection, latency reporting, device selection, and audio-thread isolation.
- [ ] Security/privacy: bind local control API to loopback by default, authenticate any LAN exposure, restrict outbound URL fetches, validate uploads, redact secrets from logs, and offer explicit telemetry consent.
- [ ] Release validation: dependency/license/SBOM audit, Windows installer smoke test, clean-machine install/uninstall, signed artifacts where supported, upgrade/rollback test, and backup/recovery drill.
- [ ] Product gaps beyond the first slice: MIDI export/import and actual instrument playback, undo/redo for every edit, automation/busses/plugin hosting, take comping, offline render, accessibility, and keyboard-focus QA.

Do not mark a gate VERIFIED from source inspection alone: require an automated test, reproducible manual test, or external license/source evidence appropriate to that gate.
