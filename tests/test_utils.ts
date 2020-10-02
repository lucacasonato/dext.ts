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
      if (options.clean) {
        try {
          await Deno.remove(
            `./tests/fixtures/${options.name}/.dext`,
            { recursive: true },
          );
        } catch {
          /* It doesn't matter if deleting fails. */
        }
      }

      const dir = `./tests/fixtures/full/${options.name}`;

      const proc = Deno.run({
        cmd: [
          "deno",
          "run",
          "-A",
          "--unstable",
          "../../../../cli.ts",
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
        await options.after({ stdout, stderr, status, dir });
      } catch (err) {
        console.log("-- START STDOUT --\n", stdout, "\n-- END STDOUT --");
        console.log("-- START STDERR --\n", stderr, "\n-- END STDERR --");
        throw err;
      }
    },
  });
}
