# C6 Music Core

Product-owned, provider-neutral foundation for the C6 Local AI Music Studio.

## Rules
- The real-time audio engine remains independent from AI inference.
- AI providers produce assets or project operations; they do not own the project.
- Providers are replaceable and license/provenance gated.
- The ACE-Step adapter is an integration boundary, not a fork of its internals.

## First integration
ACE-Step 1.5 is exposed through `AceStepProvider`. The runtime implementation is supplied by the host application.