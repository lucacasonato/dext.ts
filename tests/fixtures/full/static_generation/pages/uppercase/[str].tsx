import { h, useLocation } from "../../deps.ts";
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
  const [path] = useLocation();
  return (
    <h1>{props.route!.str} {props.data.str} {path}</h1>
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
