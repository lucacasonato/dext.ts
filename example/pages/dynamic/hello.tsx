import { Fragment, h } from "../../deps.ts";
import type { PageProps } from "../../deps.ts";

interface Props {
  capitalizedName: string;
}

function UserPage(props: PageProps<Props>) {
  return (
    <>
      <h1>
        hello
      </h1>
      <p>
        <a href="/">Go home</a>
      </p>
    </>
  );
}

export default UserPage;
