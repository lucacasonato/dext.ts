import { oak } from "../../../deps/mod.ts";

export default (ctx: oak.RouterContext) => {
  ctx.response.body = { "hello": "world" };
};
