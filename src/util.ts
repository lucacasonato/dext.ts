import { path, fs } from "../deps/mod.ts";

export interface Page {
  path: string;
  name: string;
  route: string;
}

export async function findPages(pagesDir: string): Promise<Page[]> {
  const dir = fs.walk(
    pagesDir,
    { includeDirs: false, includeFiles: true, exts: ["tsx", "jsx"] },
  );
  const pages: string[] = [];
  for await (const file of dir) {
    if (file.isFile) {
      pages.push(path.relative(pagesDir, file.path));
    }
  }
  return pages.map((page) => {
    const name = page.substring(0, page.length - path.extname(page).length);
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

    return ({
      path: path.join(pagesDir, page),
      name,
      route,
    });
  });
}
