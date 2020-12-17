import type { Router } from "./router.ts";

export function initRouter(
  router: Router<unknown>,
  navigate: (to: string) => void,
) {
  function routeFromLink(node: HTMLAnchorElement) {
    // only valid elements
    if (!node || !node.getAttribute) return;

    const href = node.getAttribute("href"),
      target = node.getAttribute("target");

    // ignore links with targets and non-path URLs
    if (
      !href ||
      !href.match(/^\//g) ||
      (target && !target.match(/^_?self$/i))
    ) {
      return;
    }

    const [route] = router.getRoute(href);
    if (route) {
      navigate(href);
      return true;
    }

    return false;
  }

  addEventListener("click", (e: MouseEvent) => {
    // ignores the navigation when clicked using right mouse button or
    // by holding a special modifier key: ctrl, command, win, alt, shift
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0) {
      return;
    }

    let t = e.target as HTMLAnchorElement;

    do {
      if (String(t.nodeName).toUpperCase() === "A" && t.getAttribute("href")) {
        if (t.hasAttribute("native")) return;
        // if link is handled by the router, prevent browser defaults
        if (routeFromLink(t)) {
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (e.stopPropagation) e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
    } while ((t = t.parentNode as HTMLAnchorElement));
  });
}
