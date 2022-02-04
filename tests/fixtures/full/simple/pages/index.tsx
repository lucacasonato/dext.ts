import { h } from "../deps.ts";
import type { PageProps } from "../deps.ts";

function IndexPage(props: PageProps) {
  return <h1>Hello World {props.pattern}</h1>;
}

export default IndexPage;
