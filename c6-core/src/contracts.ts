export type ProviderKind = "music-generation"|"stem-separation"|"voice"|"transcription"|"lyrics"|"mixing"|"mastering";

export interface ProviderContext {
  projectId: string;
  jobId: string;
  signal?: AbortSignal;
}

export interface AudioAsset {
  id: string;
  uri: string;
  format: "wav"|"flac"|"aiff"|"mp3"|"ogg"|"unknown";
  sampleRate?: number;
  channels?: number;
  durationSeconds?: number;
}

export interface GenerationRequest {
  prompt: string;
  lyrics?: string;
  durationSeconds?: number;
  seed?: number;
  referenceAudio?: AudioAsset[];
  parameters?: Record<string, unknown>;
}

export interface GenerationResult {
  assets: AudioAsset[];
  metadata: Record<string, unknown>;
}

export interface MusicGenerationProvider {
  readonly kind: "music-generation";
  readonly id: string;
  capabilities(): string[];
  generate(request: GenerationRequest, context: ProviderContext): Promise<GenerationResult>;
}

export interface StemSeparationProvider {
  readonly kind: "stem-separation";
  readonly id: string;
  capabilities(): string[];
  separate(input: AudioAsset, context: ProviderContext): Promise<AudioAsset[]>;
}

export interface VoiceProvider {
  readonly kind: "voice";
  readonly id: string;
  capabilities(): string[];
}

export interface TranscriptionProvider {
  readonly kind: "transcription";
  readonly id: string;
  capabilities(): string[];
}

export interface ProviderDescriptor {
  id: string;
  kind: ProviderKind;
  version: string;
  license: string;
  status: "dev"|"verified"|"blocked";
  localOnly?: boolean;
}

export interface ProviderRegistry {
  register(descriptor: ProviderDescriptor): void;
  list(kind?: ProviderKind): ProviderDescriptor[];
  require(id: string): ProviderDescriptor;
}