const [{ getStaticData }, rawData]: [
  // deno-lint-ignore ban-types
  { getStaticData: Function },
  Uint8Array,
] = await Promise.all([
  // deno-lint-ignore no-undef
  import(Deno.args[0]),
  Deno.readAll(Deno.stdin),
]);
const data = rawData.length == 0
  ? undefined
  : JSON.parse(new TextDecoder().decode(rawData));
if (getStaticData) {
  console.log(JSON.stringify(await getStaticData(data)));
} else {
  Deno.exit(0);
}
