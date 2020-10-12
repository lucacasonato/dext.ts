import { Fragment, h, useLocation } from "../deps.ts";
import type { GetStaticData, PageProps } from "../deps.ts";

interface Data {
  random: string;
}

function IndexPage(props: PageProps<Data>) {
  const [path] = useLocation();
  console.log("index", path);

  return (
    <>
      <h1>Hello World!!!</h1>
      <p>{typeof navigator === "object" ? "Client" : "SSG"}</p>
      <p>The random is {props.data.random}.</p>
      <p>
        <a href="/user/luca">Go to @luca</a>
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
