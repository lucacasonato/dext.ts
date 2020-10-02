// deno-lint-ignore no-undef
const hr = new WebSocket(`ws://${location.host}/_dext/hr`);
hr.addEventListener("message", (e) => {
  if (e.data === "reload") {
    // deno-lint-ignore no-undef
    location.reload();
  }
});
