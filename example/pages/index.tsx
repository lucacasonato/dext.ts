import { h, Fragment } from "../deps.ts";

function IndexPage() {
  const hello = "";

  return (
    <>
      <h1>Hello World!!!</h1>
      <p>This is the index page.</p>
      <p>
        <a href="/user/lucacasonato">Go to @lucacasonato</a>
      </p>
    </>
  );
}

export default IndexPage;
