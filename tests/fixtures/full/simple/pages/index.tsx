import { h, useLocation } from "../deps.ts";
import type { PageProps } from "../deps.ts";

function IndexPage(props: PageProps) {
  const [, , pattern] = useLocation();
  return <h1>Hello World {pattern}</h1>;
}

export default IndexPage;
