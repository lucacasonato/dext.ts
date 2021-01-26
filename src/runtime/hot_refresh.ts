export default function hotRefresh(host = location.host) {
  const hr = new WebSocket(`ws://${host}/_dext/hr`);
  hr.addEventListener("message", (e) => {
    if (e.data === "reload") {
      location.reload();
    }
  });
}
