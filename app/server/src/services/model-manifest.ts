import { readFile } from "node:fs/promises";
import path from "node:path";

export type ModelBackend = "cpu" | "cuda" | "rocm" | "metal";

export interface RuntimeModelManifest {
  id: string;
  version: string;
  providerId: string;
  license: string;
  weightsLicense?: string;
  licenseVerified?: boolean;
  weightsLicenseVerified?: boolean;
  provenanceVerified?: boolean;
  commercialRedistribution: boolean;
  localInference: boolean;
  minVramGb?: number;
  backends: ModelBackend[];
  provenance: string;
}

export interface ModelManifestLoadResult {
  models: RuntimeModelManifest[];
  warning?: string;
  source: "configured-file" | "not-configured" | "invalid";
}

const BACKENDS = new Set<ModelBackend>(["cpu", "cuda", "rocm", "metal"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateManifest(value: unknown, index: number): RuntimeModelManifest {
  if (!isRecord(value)) throw new Error(`Model manifest at index ${index} must be an object`);
  const requiredStrings = ["id", "version", "providerId", "license", "provenance"] as const;
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string" || !value[key].trim()) {
      throw new Error(`Model manifest at index ${index} requires ${key}`);
    }
  }
  if (typeof value.commercialRedistribution !== "boolean" || typeof value.localInference !== "boolean") {
    throw new Error(`Model manifest at index ${index} requires boolean commercialRedistribution and localInference`);
  }
  if (!Array.isArray(value.backends) || value.backends.length === 0 ||
      value.backends.some(backend => typeof backend !== "string" || !BACKENDS.has(backend as ModelBackend))) {
    throw new Error(`Model manifest at index ${index} has invalid backends`);
  }
  if (value.minVramGb !== undefined &&
      (typeof value.minVramGb !== "number" || !Number.isFinite(value.minVramGb) || value.minVramGb < 0)) {
    throw new Error(`Model manifest at index ${index} has invalid minVramGb`);
  }
  for (const key of ["licenseVerified", "weightsLicenseVerified", "provenanceVerified"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      throw new Error(`Model manifest at index ${index} has invalid ${key}`);
    }
  }
  if (value.weightsLicense !== undefined && typeof value.weightsLicense !== "string") {
    throw new Error(`Model manifest at index ${index} has invalid weightsLicense`);
  }
  return {
    id: value.id as string,
    version: value.version as string,
    providerId: value.providerId as string,
    license: value.license as string,
    provenance: value.provenance as string,
    commercialRedistribution: value.commercialRedistribution,
    localInference: value.localInference,
    backends: [...new Set(value.backends as ModelBackend[])],
    ...(typeof value.weightsLicense === "string" ? { weightsLicense: value.weightsLicense } : {}),
    ...(typeof value.minVramGb === "number" ? { minVramGb: value.minVramGb } : {}),
    ...(typeof value.licenseVerified === "boolean" ? { licenseVerified: value.licenseVerified } : {}),
    ...(typeof value.weightsLicenseVerified === "boolean" ? { weightsLicenseVerified: value.weightsLicenseVerified } : {}),
    ...(typeof value.provenanceVerified === "boolean" ? { provenanceVerified: value.provenanceVerified } : {})
  };
}

/** Loads only an explicitly configured local manifest file; never downloads or auto-approves models. */
export async function loadModelManifests(): Promise<ModelManifestLoadResult> {
  const configuredPath = process.env.C6_MODEL_MANIFEST_PATH?.trim();
  if (!configuredPath) {
    return { models: [], source: "not-configured", warning: "Set C6_MODEL_MANIFEST_PATH to a reviewed local JSON manifest file." };
  }
  try {
    const absolutePath = path.resolve(configuredPath);
    const parsed: unknown = JSON.parse(await readFile(absolutePath, "utf8"));
    const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.models) ? parsed.models : null;
    if (!entries) throw new Error("Manifest file must be a JSON array or an object containing a models array");
    const models = entries.map(validateManifest);
    const ids = new Set<string>();
    for (const model of models) {
      if (ids.has(model.id)) throw new Error(`Duplicate model id: ${model.id}`);
      ids.add(model.id);
    }
    return { models, source: "configured-file" };
  } catch (error) {
    return {
      models: [],
      source: "invalid",
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}
