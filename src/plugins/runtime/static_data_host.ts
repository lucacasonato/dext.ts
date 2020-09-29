// deno-lint-ignore no-undef
const { getStaticData } = await import(Deno.args[0]);
if (getStaticData) {
  console.log(JSON.stringify(await getStaticData()));
} else {
  Deno.exit(0);
}
