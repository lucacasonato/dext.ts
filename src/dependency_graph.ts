const decoder = new TextDecoder();

export interface DepGraph {
  root: string;
  modules: Module[];
}

export interface Module {
  specifier: string;
  dependencies: [];
}

export interface Dependency {
  specifier: string;
  isDynamic: boolean;
  code?: string;
  type?: string;
}

async function runDenoInfo(entrypoint: string): Promise<DepGraph> {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "info",
      "--json",
      "--unstable",
      "--no-check",
      entrypoint,
    ],
    stdout: "piped",
    stderr: "inherit",
  });
  const file = await p.output();
  const status = await p.status();
  p.close();
  if (!status.success) {
    throw new Error(`Failed to run deno info for ${entrypoint}`);
  }
  const text = decoder.decode(file);
  return JSON.parse(text);
}

export async function dependencyList(entrypoints: string[]): Promise<string[]> {
  const dependencies = new Set<string>();

  for (const entrypoint of entrypoints) {
    if (dependencies.has(entrypoint)) continue;
    const graph = await runDenoInfo(entrypoint);
    graph.modules.forEach((dep) => dependencies.add(dep.specifier));
  }

  return [...dependencies];
}
