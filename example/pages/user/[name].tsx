import { Fragment, h } from "../../deps.ts";
import type {
  GetStaticData,
  GetStaticDataContext,
  GetStaticPaths,
  PageProps,
} from "../../deps.ts";

interface Props {
  capitalizedName: string;
}

function UserPage(props: PageProps<Props>) {
  const name = props.route?.name ?? "";

  return (
    <>
      <h1>
        This is the page for {name} - {props.data.capitalizedName}
      </h1>
      <p>
        <a href="/">Go home</a>
      </p>
    </>
  );
}

export const getStaticPaths = (): GetStaticPaths => {
  return {
    pages: [
      {
        name: "luca",
      },
      {
        name: "bartek",
      },
      {
        name: "ry",
      },
    ],
  };
};

export const getStaticData = (
  ctx: GetStaticDataContext,
): GetStaticData<Props> => {
  return {
    data: {
      capitalizedName: (ctx.route!.name as string).toUpperCase(),
    },
  };
};

export default UserPage;
