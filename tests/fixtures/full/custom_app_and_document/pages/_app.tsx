import { Fragment, h } from "../deps.ts";
import type { AppProps } from "../deps.ts";

function App(props: AppProps) {
  return (
    <>
      <p>My Custom App!</p>
      {props.children}
    </>
  );
}

export default App;
