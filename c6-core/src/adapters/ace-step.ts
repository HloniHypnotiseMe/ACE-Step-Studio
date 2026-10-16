import type { GenerationRequest, GenerationResult, MusicGenerationProvider, ProviderContext } from "../contracts.js";

export interface AceStepRuntime {
  generate(request: GenerationRequest, context: ProviderContext): Promise<GenerationResult>;
}

export class AceStepProvider implements MusicGenerationProvider {
  readonly kind = "music-generation" as const;
  readonly id = "ace-step-1.5";
  constructor(private readonly runtime: AceStepRuntime) {}
  capabilities(): string[] { return ["text-to-music","lyrics-to-music","reference-audio","variation","continuation","repaint"]; }
  generate(request: GenerationRequest, context: ProviderContext): Promise<GenerationResult> {
    return this.runtime.generate(request, context);
  }
}