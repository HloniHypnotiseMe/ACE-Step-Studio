export type HardwareBackend = "cpu" | "cuda" | "rocm" | "metal";

export interface ModelManifest {
  id: string;
  version: string;
  providerId: string;
  license: string;
  weightsLicense?: string;
  /** Explicit evidence review flags. Missing values are treated as unverified. */
  licenseVerified?: boolean;
  weightsLicenseVerified?: boolean;
  provenanceVerified?: boolean;
  commercialRedistribution: boolean;
  localInference: boolean;
  minVramGb?: number;
  backends: HardwareBackend[];
  provenance: string;
}

export class ModelRegistry {
  private readonly models = new Map<string, ModelManifest>();

  register(model: ModelManifest): void {
    if (!model.id.trim()) throw new Error("Model id is required");
    if (!model.version.trim()) throw new Error(`Model version is required: ${model.id}`);
    if (!model.license.trim()) throw new Error(`Model license is required: ${model.id}`);
    if (!model.provenance.trim()) throw new Error(`Model provenance is required: ${model.id}`);
    if (model.minVramGb !== undefined && (!Number.isFinite(model.minVramGb) || model.minVramGb < 0)) {
      throw new Error(`Invalid VRAM requirement: ${model.id}`);
    }
    this.models.set(model.id, { ...model, backends: [...model.backends] });
  }

  get(id: string): ModelManifest | undefined {
    const model = this.models.get(id);
    return model ? { ...model, backends: [...model.backends] } : undefined;
  }

  list(): ModelManifest[] {
    return [...this.models.values()].map(model => ({ ...model, backends: [...model.backends] }));
  }

  eligible(backend: HardwareBackend, vramGb = 0): ModelManifest[] {
    return this.list().filter(model =>
      model.localInference &&
      model.backends.includes(backend) &&
      (model.minVramGb === undefined || vramGb >= model.minVramGb)
    );
  }

  isEligible(id: string, backend: HardwareBackend, vramGb = 0): boolean {
    return this.eligible(backend, vramGb).some(model => model.id === id);
  }

  /** Commercial distribution is blocked until code, weights, and provenance are explicitly reviewed. */
  commercialReady(backend: HardwareBackend, vramGb = 0): ModelManifest[] {
    return this.eligible(backend, vramGb).filter(model =>
      model.commercialRedistribution &&
      model.licenseVerified === true &&
      model.weightsLicenseVerified === true &&
      model.provenanceVerified === true
    );
  }
}
