import { Fragment, h } from "../../deps.ts";
import type { PageProps } from "../../deps.ts";

interface Props {
  capitalizedName: string;
}

function UserPage(props: PageProps<Props>) {
  const rest = props.route?.rest ?? "";

  return (
    <>
      <h1>
        REST {rest}
      </h1>
      <p>
        <a href="/">Go home</a>
      </p>
    </>
  );
}

export default UserPage;
