import type { ProviderDescriptor, ProviderKind, ProviderRegistry } from "./contracts.js";

export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly providers = new Map<string, ProviderDescriptor>();
  register(descriptor: ProviderDescriptor): void {
    if (this.providers.has(descriptor.id)) throw new Error(`Provider already registered: ${descriptor.id}`);
    this.providers.set(descriptor.id, descriptor);
  }
  list(kind?: ProviderKind): ProviderDescriptor[] {
    return [...this.providers.values()].filter(p => !kind || p.kind === kind);
  }
  require(id: string): ProviderDescriptor {
    const provider = this.providers.get(id);
    if (!provider) throw new Error(`Provider not registered: ${id}`);
    return provider;
  }
}