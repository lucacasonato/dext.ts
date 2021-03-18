import { Fragment, h, useLocation } from "../deps.ts";
import type { GetStaticData, PageProps } from "../deps.ts";

interface Data {
  random: string;
}

function IndexPage(props: PageProps<Data>) {
  const [path, navigate] = useLocation();

  return (
    <>
      <h1>Hello World!!!</h1>
      <p>{typeof navigator === "object" ? "Client" : "SSG"}</p>
      <p>The random is {props.data.random}.</p>
      <p>
        <a href="/user/luca">Go to @luca</a>
      </p>
      <p>
        <a href="/user/luca?foo=1&bar=2">Go to @luca with query params</a>
      </p>
      <p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/user/luca?baz=3");
          }}
        >
          Go to @luca with query params with navigate
        </a>
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
