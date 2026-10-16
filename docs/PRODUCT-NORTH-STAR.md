# C6 Local AI Music Studio — Product North Star

## Mission
Build a downloadable, local-first AI music production application that unifies:
1. prompt-to-song generation,
2. editable stems and audio,
3. FL Studio-class beat/MIDI workflows,
4. Logic Pro-class recording/arrangement/mixing,
5. an AI Producer that can operate on the project without taking control away from the musician.

The product is inspired by capabilities users expect from Suno, FL Studio and Logic Pro. It must not copy proprietary code, assets, branding, UI, models, or protected implementation details.

## End State
Prompt → generate → audition variations → open as a DAW project → explode to stems/MIDI → edit/record/arrange → AI-assisted mix/master → export.

## Non-negotiables
- Local-first core workflow.
- Cloud is optional, never the architectural dependency.
- AI never blocks the real-time audio thread.
- Every AI action is previewable, reversible and represented as editable project operations.
- Models are replaceable behind stable interfaces.
- User-owned/authorized audio and voice data only.
- Every third-party model/code dependency gets a license/provenance gate before distribution.
- Windows and macOS are first-class targets.

## Product Modes
- IDEA: prompt and generate.
- BEAT: step sequencer, piano roll, MIDI and groove.
- STUDIO: timeline, recording, comping, routing, mixer and plugins.
- AI PRODUCER: natural-language project operations, arrangement, sound design, mixing and mastering assistance.

## First shippable vertical slice
1. Local song generation.
2. Generation history/variations.
3. Stem extraction.
4. Waveform timeline.
5. Basic multitrack playback/mute/solo/gain/pan.
6. Save/load project.
7. Export WAV/FLAC/MP3.
8. Hardware/model detection.
9. Model manager.
10. Crash-safe AI worker isolation.

This repository is the starting implementation substrate, not the final architecture. Existing ACE-Step Studio functionality is to be preserved while it is mapped into the new architecture.
