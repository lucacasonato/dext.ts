import { h } from "../deps.ts";
import type { PageProps } from "../deps.ts";

function IndexPage(props: PageProps) {
  return (
    <div class="mx-auto max-w-screen-md px-4 sm:px-6 md:px8">
      <div class="flex flex-col items-center my-8 sm:my-12 md:my-16">
        <img
          src="/logo.png"
          alt="dext logo"
          class="w-16 h-16 mb-8"
          style={{ "imageRendering": "pixelated" }}
        />
        <h1 class="text-4xl sm:text-5xl font-semibold">Dext.ts</h1>
        <p class="text-2xl text-gray-900 text-center">
          The <a
            href="https://preactjs.com/"
            class="text-black hover:underline"
          >
            Preact
          </a> Framework for <a
            href="https://deno.land/"
            class="text-black hover:underline"
          >
            Deno
          </a>
        </p>
      </div>
      <div class="prose prose-lg mt-12 mb-24">
        <p>
          Dext.ts is a tiny framework for building web applications using
          Preact. It runs on Deno and uses <a href="https://rollupjs.org">
            Rollup
          </a> and <a href="https://denopack.mod.land">
            denopack
          </a>. It heavily inspired by the awesome <a href="https://nextjs.org">
            Next.js
          </a>.
        </p>

        <ul>
          <li>
            <b>Fast</b>: 100/100 Lighthouse score (<a
              href="https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdext.fly.dev%2F"
            >
              proof
            </a>)
          </li>
          <li><b>Tiny</b>: productive environment in only 5.75KB</li>
          <li><b>Zero config</b> and out of the box support for TypeScript</li>
          <li><b>Pre-render</b> pages at build time (SSG)</li>
          <li><b>Client hydration</b> of pre-rendered pages</li>
          <li>Built-in <b>file-system based routing</b></li>
          <li>Code-splitting, bundling, and tree shaking</li>
        </ul>

        <h3>Installation</h3>
        <p>
          To get started with <code>
            dext
          </code>, you will need to install it. To do this, make sure you have
          <code>deno</code> 1.4.4 or later installed, and run the command below.
          <pre>
            deno install --allow-read --allow-write --allow-env --allow-net
            --allow-run --unstable -f -n dext
            https://deno.land/x/dext@0.7.0/cli.ts
          </pre>
        </p>

        <h3>Getting started</h3>
        <p>
          Now that you have installed the <code>dext</code>
          {" "}command line tool, you can create your first project. To scaffold
          out the required file structure, run the <code>dext create</code>
          {" "}command:
        </p>
        <pre>
          dext create myproject
        </pre>

        <p>
          Now enter the created directory (<code>
            cd myproject
          </code>), and run the <code>deno dev</code>
          {" "} command to start a development server:
        </p>
        <pre>
          {`❯❯❯ dext dev
Listening on http://127.0.0.1:3000
Started build...
Build success done 8535ms`}
        </pre>
        <p>
          You can now visit the page at <a href="http://127.0.0.1:3000">
            http://127.0.0.1:3000
          </a>.
        </p>
        <p>
          To create a production build, run <code>
            dext build
          </code>. This will create a highly optimized production bundle. You
          can serve this bundle by using <code>dext start</code>.
        </p>
        <pre>
          {`❯❯❯ dext build                                                                                                                                                                                                      /m/f/P/g/l/d/docs ❯❯❯ dext build
Build success.

Page                           Size     First Load JS
- ○ /                          4.42 kB  6.49 kB      
                                                     
+ First Load JS shared by all  2.07 kB               
  └ /main-dda0a99f.js          2.07 kB               

○  (Static)  automatically rendered as static HTML
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticData)

File sizes are measured after brotli compression.

❯❯❯ dext start
Listening on http://127.0.0.1:3000`}
        </pre>
      </div>
    </div>
  );
}

export default IndexPage;
