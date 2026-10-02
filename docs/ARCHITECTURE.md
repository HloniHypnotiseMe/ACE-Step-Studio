# C6 Local AI Music Studio — Target Architecture

## Layer 0 — Desktop Shell
Cross-platform desktop application with a stable UI boundary and native audio integration.

## Layer 1 — DAW Core
Deterministic, real-time-safe engine:
- audio graph
- transport/clock
- tracks/clips
- MIDI
- mixer/busses
- automation
- recording
- plugin hosting
- offline rendering

The audio callback must never call an LLM, diffusion model, filesystem-heavy operation or network request.

## Layer 2 — Project Engine
Portable project package:
```
Project/
  project.json
  audio/
  stems/
  midi/
  samples/
  presets/
  renders/
  ai/
```

AI actions become versioned project operations so users can undo, inspect and reproduce changes.

## Layer 3 — AI Orchestrator
Stable interfaces:
- MusicGenerationProvider
- StemSeparationProvider
- VoiceProvider
- TranscriptionProvider
- LyricsProvider
- MixingAssistant
- MasteringAssistant

Providers are replaceable. The product never hardcodes one model into the project format.

## Layer 4 — Local AI Runtime
Separate worker process/service:
- model manager
- hardware detection
- queueing
- VRAM/RAM management
- model lifecycle
- inference isolation
- telemetry local-only by default

## Layer 5 — Model Adapters
Initial adapters may wrap existing open-source/local projects. Each adapter must record:
- upstream repository
- commit/version
- model weights
- license
- attribution
- runtime constraints
- commercial redistribution status

## Layer 6 — Optional Cloud Turbo
Explicit opt-in only. No core project dependency.

## Hardware abstraction
```
CPU
CUDA
ROCm
Metal/MPS
future backends
```

The runtime chooses an execution profile:
FAST / BALANCED / QUALITY / ULTRA.

## Security and provenance
- local projects stay local by default.
- voice cloning requires user confirmation and provenance metadata.
- no scraping of third-party accounts/cookies.
- no dependence on reverse-engineered commercial APIs for production.
