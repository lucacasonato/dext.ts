const { getStaticPaths } = await import(Deno.args[0]);
if (getStaticPaths) {
  console.log(JSON.stringify(await getStaticPaths()));
} else {
  Deno.exit(0);
}
