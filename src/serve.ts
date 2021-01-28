import {
  colors,
  dateFormat,
  isWebSocketCloseEvent,
  oak,
  WebSocket,
} from "../deps/mod.ts";
import type { Page } from "./util.ts";
import { addApis } from "./apis.ts";

export async function serve(
  pages: Page[],
  options: {
    staticDir: string;
    address: string;
    quiet: boolean;
    hotRefresh?: AsyncIterableIterator<void>;
  },
): Promise<void> {
  const hmrListeners = new Set<WebSocket>();
  const app = new oak.Application({ state: hmrListeners });
  const router = new oak.Router();

  if (options.hotRefresh) {
    router.get("/_dext/hr", async (ctx) => {
      if (!ctx.isUpgradable) {
        throw new Error("no websocket for you");
      }
      const socket = await ctx.upgrade();
      hmrListeners.add(socket);
      for await (const ev of socket) {
        if (isWebSocketCloseEvent(ev)) {
          hmrListeners.delete(socket);
        }
      }
    });
  }

  for (const page of pages) {
    router.get(page.route, async (context) => {
      await oak.send(
        context,
        (page.hasGetStaticPaths ? context.request.url.pathname : page.name) +
          ".html",
        { root: options.staticDir },
      );
    });
  }

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
  addApis(router);
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (context) => {
    await oak.send(context, context.request.url.pathname, {
      root: options.staticDir,
    });
  });

  app.addEventListener("listen", ({ hostname, port }) => {
    console.log(
      colors.green(`Listening on http://${hostname || "127.0.0.1"}:${port}`),
    );
  });

  async function hotRefreshLoop() {
    for await (const _ of options.hotRefresh!) {
      for (const ws of hmrListeners) {
        await ws.send("reload");
      }
    }
  }

  await Promise.all([
    app.listen(options.address),
    options.hotRefresh ? hotRefreshLoop() : Promise.resolve(),
  ]);
}
