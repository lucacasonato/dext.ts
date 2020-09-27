import { h, Fragment } from "../deps.ts";

function IndexPage() {
  return (
    <>
      <h1>Hello World!</h1>
      <p>This is the index page.</p>
      <p>
        <a href="/user/[name]">Go to @lucacasonato</a>
      </p>
    </>
  );
}

export default IndexPage;
