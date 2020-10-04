import { h } from "../deps.ts";
import type { AppProps } from "../deps.ts";

function App(props: AppProps) {
  return (
    <div style="margin: 10px; padding: 10px; border: black 2px dashed;">
      {props.children}
    </div>
  );
}

export default App;
