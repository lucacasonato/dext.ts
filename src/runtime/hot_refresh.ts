// deno-lint-ignore no-undef
export default function hotRefresh(host = location.host) {
  const hr = new WebSocket(`ws://${host}/_dext/hr`);
  hr.addEventListener("message", (e) => {
    if (e.data === "reload") {
      // deno-lint-ignore no-undef
      location.reload();
    }
  });
}
