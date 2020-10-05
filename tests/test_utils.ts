import { copy, ensureDir, join } from "../deps/test.ts";

const decoder = new TextDecoder();

export function integrationTest(options: {
  name: string;
  cmd: string[];
  after(
    ctx: {
      stdout: string;
      stderr: string;
      status: Deno.ProcessStatus;
      dir: string;
    },
  ): Promise<void>;
  ignore?: boolean;
  clean?: boolean;
}) {
  Deno.test({
    name: `[integration] ${options.name} ${options.cmd.join(" ")}`,
    ignore: options.ignore,
    async fn() {
      const tmp = await Deno.makeTempDir();
      const root = join(tmp, "dextts");
      const dir = join(root, `./tests/fixtures/full/${options.name}`);
      await copy("./", root);
      await ensureDir(dir);

      const cli = new URL("../cli.ts", root).toString();

      const proc = Deno.run({
        cmd: [
          "deno",
          "run",
          "-A",
          "--unstable",
          cli,
          ...options.cmd,
        ],
        cwd: dir,
        stdout: "piped",
        stderr: "piped",
      });
      const stdout = decoder.decode(await proc.output());
      const stderr = decoder.decode(await proc.stderrOutput());
      const status = await proc.status();
      proc.close();

      try {
        await options.after({ stdout, stderr, status, dir: dir });
      } catch (err) {
        console.log("-- START STDOUT --\n", stdout, "\n-- END STDOUT --");
        console.log("-- START STDERR --\n", stderr, "\n-- END STDERR --");
        throw err;
      }

      // FIXME(lucacasonato): can't delete folders in tempdir on windows?!
      // see https://github.com/lucacasonato/dext.ts/pull/22/checks?check_run_id=1205241971#step:7:61
      if (Deno.build.os !== "windows") {
        await Deno.remove(tmp, { recursive: true });
      }
    },
  });
}
