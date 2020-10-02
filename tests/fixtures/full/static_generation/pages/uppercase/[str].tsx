import { h } from "../../deps.ts";
import type {
  GetStaticData,
  GetStaticDataContext,
  GetStaticPaths,
  PageProps,
} from "../../deps.ts";

interface Props {
  str: string;
}

function IndexPage(props: PageProps<Props>) {
  return (
    <h1>{props.route!.str} {props.data.str}</h1>
  );
}

export function getStaticPaths(): GetStaticPaths {
  return {
    pages: [
      { route: { str: "luca" } },
      { route: { str: "bartek" } },
      { route: { str: "ryan" } },
    ],
  };
}

export function getStaticData(ctx: GetStaticDataContext): GetStaticData<Props> {
  return {
    data: {
      str: (ctx.route!.str as string).toUpperCase(),
    },
  };
}

export default IndexPage;
