import { h, Fragment } from "../deps.ts";
import type { PageProps, GetStaticData } from "../deps.ts";

interface Data {
  random: string;
}

function IndexPage(props: PageProps<Data>) {
  return (
    <>
      <h1>Hello World!!!</h1>
      <p>This is the index page.</p>
      <p>The random is {props.data.random}.</p>
      <p>
        <a href="/user/lucacasonato">Go to @lucacasonato</a>
      </p>
    </>
  );
}

export const getStaticData = (): GetStaticData<Data> => {
  return {
    data: {
      random: Math.random().toString(),
    },
  };
};

export default IndexPage;
