import { Command, CompletionsCommand } from "./deps/mod.ts";
import { build } from "./src/build.ts";
import { findPages } from "./src/util.ts";

console.log(await findPages(Deno.cwd()));

await new Command()
  .name("dext")
  .version("0.1.0")
  .description("The Preact Framework for Deno")
  .action(function () {
    console.log(this.getHelp());
  })
  .command("build")
  .description("Build your application.")
  .action(build)
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
