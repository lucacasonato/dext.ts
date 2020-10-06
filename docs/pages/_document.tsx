import { h } from "../deps.ts";
import type { DocumentProps } from "../deps.ts";

function Document(props: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/tailwind.min.css" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        {props.children}
      </body>
    </html>
  );
}

export default Document;
