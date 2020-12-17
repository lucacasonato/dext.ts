# dext.ts

![logo](example/public/static/logo.png)

The Preact Framework for Deno. Dext.ts is heavily inspired by Next.js.

- Zero config
- Pre-render pages at build time (SSG)
- Tiny (example is only 5.75KB of JS)
- Client hydration
- Built-in routing
- Zero config TypeScript support
- File-system routing
- Code-splitting, bundling, and tree shaking built in

## Installing

To install, run the following command. This will make the `dext` CLI available in your path.

```
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --unstable -f -n dext https://deno.land/x/dext@0.10.1/cli.ts
```

## Getting started

To create a new project run `dext create myproject`. This will scaffold a new dext project in the
`myproject` folder. This folder contains a few files:

- `deps.ts` contains all of your projects dependencies.
- `pages/index.tsx` is the source for the `/` of your project.
- `pages/user/[name].tsx` is the source for all routes at `/user/[name]` (e.g. `/user/luca` and `/user/bartek`).
- `tsconfig.json` is the TypeScript configuration that the project uses.
- `.gitignore` tells `git` to ignore the `.dext` folder that is created by `dext dev` and `dext build`.

Now that you have a project set up, you can start the development server using `dext dev`.
After a few seconds you can view your built page at http://127.0.0.1:3000. When you change
any of the files in the `pages` directory, your project will be rebuilt automatically, and
the page will be automatically reloaded in the browser.

When you are ready to deploy to production, run `dext build`. This will generate a production
optimized build. You can start a production webserver to serve this build with `dext start`.

## Example

For an example, see the `/example` folder. You can create a production build it by running
`dext build`, and then serve it by running `dext start`. You can also run `dext dev` to
start watching, building, and serving.

You can also see a deployed version of this example on at https://dext.fly.dev.
