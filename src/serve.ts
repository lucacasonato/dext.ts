import { colors, dateFormat, oak } from "../deps/mod.ts";
import type { Page } from "./util.ts";

export async function serve(
  pages: Page[],
  options: { staticDir: string; address: string; quiet: boolean },
): Promise<void> {
  const router = new oak.Router();

  for (const page of pages) {
    router.get(
      page.route,
      async (context) => {
        await oak.send(
          context,
          (page.hasGetStaticPaths ? context.request.url.pathname : page.name) +
            ".html",
          { root: options.staticDir },
        );
      },
    );
  }

  const app = new oak.Application();

  if (!options.quiet) {
    app.use(async (ctx, next) => {
      const start = new Date();
      await next();
      console.log(
        `[${
          dateFormat(start, "yyyy-MM-dd HH:mm:ss")
        }] ${ctx.request.method} ${ctx.request.url}`,
      );
    });
  }

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (context) => {
    await oak.send(context, context.request.url.pathname, {
      root: options.staticDir,
    });
  });

  app.addEventListener("listen", ({ hostname, port }) => {
    console.log(colors.green(
      `Listening on http://${hostname || "127.0.0.1"}:${port}`,
    ));
  });

  await app.listen(options.address);
}
