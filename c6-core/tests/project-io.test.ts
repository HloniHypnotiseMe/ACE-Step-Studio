import { describe, expect, it } from "vitest";
import { createProject } from "../src/project";
import { deserializeProject, serializeProject } from "../src/project-io";

describe("project persistence", () => {
  it("round trips the editable project", () => {
    const project=createProject("Demo");
    const restored=deserializeProject(serializeProject(project,["audio/demo.wav"]));
    expect(restored.name).toBe("Demo");
    expect(restored.sampleRate).toBe(48000);
  });
});
