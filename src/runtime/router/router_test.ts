import { Router } from "./router.ts";
import { assertEquals } from "../../../deps/test.ts";

Deno.test({
  name: "router match",
  fn() {
    const router = new Router([
      ["/", 0],
      ["/hello", 0],
      ["/hellow", 0],
      ["/abc/:foo", 0],
      ["/xyz/:rest*", 0],
    ]);

    assertEquals(router.getRoute("/"), [["/", 0], {}]);
    assertEquals(router.getRoute("/foo"), [null, {}]);
    assertEquals(router.getRoute("/hello"), [["/hello", 0], {}]);
    assertEquals(router.getRoute("/hello/"), [["/hello", 0], {}]);
    assertEquals(router.getRoute("/hello/as"), [null, {}]);
    assertEquals(router.getRoute("/hellow"), [["/hellow", 0], {}]);
    assertEquals(router.getRoute("/abc"), [null, {}]);
    assertEquals(router.getRoute("/abc/"), [null, {}]);
    assertEquals(router.getRoute("/abc/bar"), [
      ["/abc/:foo", 0],
      { foo: "bar" },
    ]);
    assertEquals(router.getRoute("/abc/bar/"), [
      ["/abc/:foo", 0],
      { foo: "bar" },
    ]);
    assertEquals(router.getRoute("/abc/bar/baz"), [null, {}]);
    assertEquals(router.getRoute("/xyz"), [["/xyz/:rest*", 0], { rest: [] }]);
    assertEquals(router.getRoute("/xyz/"), [["/xyz/:rest*", 0], { rest: [] }]);
    assertEquals(router.getRoute("/xyz/foo"), [
      ["/xyz/:rest*", 0],
      { rest: ["foo"] },
    ]);
    assertEquals(router.getRoute("/xyz/foo/bar"), [
      ["/xyz/:rest*", 0],
      { rest: ["foo", "bar"] },
    ]);
  },
});
