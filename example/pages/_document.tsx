import { h } from "../deps.ts";
import type { DocumentProps } from "../deps.ts";

function Document(props: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/static/style.css" />
      </head>
      <body>{props.children}</body>
    </html>
  );
}

export default Document;
