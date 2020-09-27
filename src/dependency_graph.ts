const decoder = new TextDecoder();

export interface DepGraph {
  [file: string]: Dep;
}

export interface Dep {
  size: number;
  deps: string[];
}

async function runDenoInfo(
  entrypoint: string,
): Promise<DepGraph> {
  const p = Deno.run({
    cmd: [
      "deno",
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
  const { files } = JSON.parse(text);
  return files;
}

export async function dependencyList(entrypoints: string[]): Promise<string[]> {
  const dependencies = new Set<string>();

  for (const entrypoint of entrypoints) {
    if (dependencies.has(entrypoint)) continue;
    const graph = await runDenoInfo(entrypoint);
    Object.keys(graph).forEach((dep) => dependencies.add(dep));
  }

  return [...dependencies];
}
