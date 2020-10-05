import { h } from "../../deps/preact/mod.ts";
import type { DocumentProps } from "./type.ts";

function Document(props: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {props.children}
      </body>
    </html>
  );
}

export default Document;
