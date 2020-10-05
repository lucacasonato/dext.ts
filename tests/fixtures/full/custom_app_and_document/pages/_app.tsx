import { h } from "../deps.ts";
import type { AppProps } from "../deps.ts";

function App(props: AppProps) {
  return (
    <div>
      <p>My Custom App!</p>
      {props.children}
    </div>
  );
}

export default App;
