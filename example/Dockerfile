FROM hayd/alpine-deno:1.6.1 as builder
WORKDIR /app
RUN deno cache --unstable https://deno.land/x/dext@0.10.2/cli.ts
COPY deps.ts deps.ts
COPY tsconfig.json tsconfig.json
RUN deno cache -c tsconfig.json deps.ts
COPY . .
RUN deno run --allow-read --allow-write --allow-env --allow-net --allow-run --unstable https://deno.land/x/dext@0.10.2/cli.ts build

FROM hayd/alpine-deno:1.6.1
WORKDIR /app
RUN deno cache --unstable https://deno.land/x/dext@0.10.2/cli.ts
COPY --from=builder /app/.dext /app/.dext
CMD [ "deno", "run", "--allow-read", "--allow-net", "--allow-env", "--unstable", "https://deno.land/x/dext@0.10.2/cli.ts", "start" ]
