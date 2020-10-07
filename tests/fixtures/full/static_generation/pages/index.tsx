import { h } from "../deps.ts";
import type {
  GetStaticData,
  GetStaticDataContext,
  PageProps,
} from "../deps.ts";

interface Props {
  hello: string;
}

function IndexPage(props: PageProps<Props>) {
  return <h1>Hello {props.data.hello}</h1>;
}

export function getStaticData(ctx: GetStaticDataContext): GetStaticData<Props> {
  return {
    data: {
      hello: "world",
    },
  };
}

export default IndexPage;
