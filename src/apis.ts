import { oak, path } from "../deps/mod.ts";

export const addApis = async (router: oak.Router) => {
  const apis = Deno.readDir("pages/api");
  for await (const api of apis) {
    const page = await import(path.resolve(`pages/api/${api.name}`));
    const url = `/${api.name.replace(/(\.ts|\s)+/g, "")}`;
    router.get(url, page.default);
  }
  return Promise.resolve();
};
