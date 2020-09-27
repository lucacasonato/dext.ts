# dext.ts

The Preact Framework for Deno. Dext.ts is heavily inspired by Next.js.

- Zero config
- Pre-render pages at build time (SSG)
- Tiny (example is only 6.2KB of JS)
- Client hydration
- Built-in routing
- Zero config TypeScript support
- File-system routing
- Code-splitting, bundling, and tree shaking built in

## Installing

To install, run the following command. This will make the `dext` CLI available in your path.

```
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --unstable https://deno.land/x/dext@0.2.0/mod.ts
```

## Example

For an example, see the `/example` folder. You can create a production build it by running
`dext build`, and then serve it by running `dext start`. You can also run `dext dev` to
start watching, building, and serving.

You can also see a deployed version of this example on at https://dext.fly.dev.
