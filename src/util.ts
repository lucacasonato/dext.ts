import { fs, path } from "../deps/mod.ts";

export interface Pages {
  pages: Page[];
  app: Page | undefined;
  document: Page | undefined;
}

export interface Page {
  path: string;
  name: string;
  route: string;
  hasGetStaticPaths: boolean;
  hasGetStaticData: boolean;
}

export async function findPages(pagesDir: string): Promise<Pages> {
  const dir = fs.walk(
    pagesDir,
    { includeDirs: false, includeFiles: true, exts: ["tsx", "jsx"] },
  );
  const pagePaths: string[] = [];
  for await (const file of dir) {
    if (file.isFile) {
      pagePaths.push(path.relative(pagesDir, file.path));
    }
  }
  pagePaths.sort();
  const allPages = await Promise.all(pagePaths.map(async (page) => {
    const name = page.substring(0, page.length - path.extname(page).length)
      .replaceAll(new RegExp(path.SEP_PATTERN, "g"), "/");
    const parts = name.split("/");
    if (parts[parts.length - 1] === "index") {
      parts.pop();
    }
    const route = "/" + parts.map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    }).join("/");

    const p = path.join(pagesDir, page).replaceAll(
      new RegExp(path.SEP_PATTERN, "g"),
      "/",
    );

    const { hasGetStaticData, hasGetStaticPaths } = await checkHasDataHooks(p);

    if (hasGetStaticPaths && !route.includes(":")) {
      throw new Error("Can not have getStaticPaths in non dynamic file");
    }
    if (hasGetStaticData && route.includes(":") && !hasGetStaticPaths) {
      throw new Error(
        "Can not have getStaticData in dynamic file without getStaticPaths",
      );
    }

    return ({
      path: p,
      name,
      route,
      hasGetStaticData,
      hasGetStaticPaths,
    });
  }));

  const pages = allPages.filter((d) =>
    !d.name.startsWith("_") && !d.name.includes("/_")
  );
  const app = allPages.find((d) => d.name === "_app");
  if (app?.hasGetStaticData === true) {
    throw new Error("_app may not have getStaticData");
  }
  const document = allPages.find((d) => d.name === "_document");
  if (document?.hasGetStaticData === true) {
    throw new Error("_document may not have getStaticData");
  }
  return {
    pages,
    app,
    document,
  };
}

export async function checkHasDataHooks(
  path: string,
): Promise<{
  hasGetStaticPaths: boolean;
  hasGetStaticData: boolean;
}> {
  const proc = Deno.run({
    cmd: ["deno", "doc", "--json", path],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();
  const { success } = await proc.status();
  proc.close();
  if (!success) {
    throw new Error("Failed to analyze " + path);
  }
  const body = new TextDecoder().decode(out);
  const data: Array<{ kind: string; name: string }> = JSON.parse(body);
  const hasGetStaticPaths =
    data.findIndex((d) =>
      (d.kind === "variable" || d.kind === "function") &&
      d.name === "getStaticPaths"
    ) !== -1;
  const hasGetStaticData =
    data.findIndex((d) =>
      (d.kind === "variable" || d.kind === "function") &&
      d.name === "getStaticData"
    ) !== -1;
  return { hasGetStaticPaths, hasGetStaticData };
}
