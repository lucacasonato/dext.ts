import { h, Fragment } from "../../deps.ts";
import type { PageProps } from "../../deps.ts";

function UserPage(props: PageProps) {
  const name = props.route?.name ?? "";

  return (
    <>
      <h1>This is the page for {name}</h1>
      <p>
        <a href="/">Go home</a>
      </p>
    </>
  );
}

export default UserPage;
