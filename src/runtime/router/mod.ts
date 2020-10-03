// deno-lint-ignore-file no-undef

import {
  cloneElement,
  Component,
  createElement,
  toChildArray,
} from "../../../deps/preact/mod.ts";
import type { ComponentChildren, VNode } from "../../../deps/preact/mod.ts";
import { assign, exec, pathRankSort, prepareVNodeForRanking } from "./util.ts";

export interface CustomHistory {
  listen(callback: (location: Location) => void): () => void;
  location: Location;
  push(path: string): void;
  replace(path: string): void;
}

let customHistory: CustomHistory | null = null;

const ROUTERS: Router[] = [];

const subscribers: ((url: string) => void)[] = [];

const EMPTY = { pathname: "", search: "" };

function setUrl(url: string, type: "push" | "replace" = "push") {
  if (customHistory && customHistory[type]) {
    customHistory[type](url);
  } else if (
    typeof history !== "undefined" &&
    history[type + "State" as ("pushState" | "replaceState")]
  ) {
    history[type + "State" as ("pushState" | "replaceState")](
      null,
      "",
      url,
    );
  }
}

function getCurrentUrl() {
  let url: { pathname: string; search: string };
  if (customHistory && customHistory.location) {
    url = customHistory.location;
  } else {
    url = typeof location !== "undefined" ? location : EMPTY;
  }
  return `${url.pathname}${url.search}`;
}

function route(url: string, replace = false) {
  // only push URL into history if we can handle it
  if (canRoute(url)) {
    setUrl(url, replace ? "replace" : "push");
  }

  return routeTo(url);
}

/** Check if the given URL can be handled by any router instances. */
function canRoute(url: string) {
  for (let i = ROUTERS.length; i--;) {
    if (ROUTERS[i].canRoute(url)) return true;
  }
  return false;
}

/** Tell all router instances to handle the given URL.  */
function routeTo(url: string) {
  let didRoute = false;
  for (let i = 0; i < ROUTERS.length; i++) {
    if (ROUTERS[i].routeTo(url) === true) {
      didRoute = true;
    }
  }
  for (let i = subscribers.length; i--;) {
    subscribers[i](url);
  }
  return didRoute;
}

function routeFromLink(node: HTMLAnchorElement) {
  // only valid elements
  if (!node || !node.getAttribute) return;

  let href = node.getAttribute("href"),
    target = node.getAttribute("target");

  // ignore links with targets and non-path URLs
  if (
    !href || !href.match(/^\//g) || (target && !target.match(/^_?self$/i))
  ) {
    return;
  }

  // attempt to route, if no match simply cede control to browser
  return route(href);
}

function handleLinkClick(e: MouseEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0) {
    return;
  }
  routeFromLink((e.currentTarget || e.target) as HTMLAnchorElement);
  return prevent(e);
}

function prevent(e: Event) {
  if (e) {
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.stopPropagation) e.stopPropagation();
    e.preventDefault();
  }
  return false;
}

function delegateLinkHandler(e: MouseEvent) {
  // ignore events the browser takes care of already:
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0) {
    return;
  }

  let t = e.target as HTMLElement;
  do {
    if (String(t.nodeName).toUpperCase() === "A" && t.getAttribute("href")) {
      if (t.hasAttribute("native")) return;
      // if link is handled by the router, prevent browser defaults
      if (routeFromLink(t as HTMLAnchorElement)) {
        return prevent(e);
      }
    }
  } while ((t = t.parentNode as HTMLElement));
}

let eventListenersInitialized = false;

function initEventListeners() {
  if (eventListenersInitialized) return;

  if (typeof addEventListener === "function") {
    if (!customHistory) {
      addEventListener("popstate", () => {
        routeTo(getCurrentUrl());
      });
    }
    addEventListener("click", delegateLinkHandler);
  }
  eventListenersInitialized = true;
}

export interface RoutableProps {
  path: string;
  default: boolean;
}

export interface RouterProps {
  history?: CustomHistory;
  static?: boolean;
  url?: string;
  onChange?: (args: RouterOnChangeArgs) => void;
  children: ComponentChildren;
}

export interface RouterOnChangeArgs {
  router: Router;
  url: string;
  previous?: string;
  active: VNode<RoutableProps>[];
  current: VNode<RoutableProps>;
}

interface RouterState {
  url: string;
}

class Router extends Component<RouterProps, RouterState> {
  updating: boolean | undefined;
  unlisten: (() => void) | undefined;
  previousUrl: string | undefined;

  constructor(props: RouterProps) {
    super(props);
    if (props.history) {
      customHistory = props.history;
    }

    this.state = {
      url: props.url || getCurrentUrl(),
    };

    initEventListeners();
  }

  shouldComponentUpdate(props: RouterProps) {
    if (props.static !== true) return true;
    return props.url !== this.props.url ||
      props.onChange !== this.props.onChange;
  }

  /** Check if the given URL can be matched against any children */
  canRoute(url: string) {
    const children = toChildArray(this.props.children) as VNode<
      RoutableProps
    >[];
    return this.getMatchingChildren(children, url, false).length > 0;
  }

  /** Re-render children with a new URL to match against. */
  routeTo(url: string) {
    this.setState({ url });

    const didRoute = this.canRoute(url);

    // trigger a manual re-route if we're not in the middle of an update:
    if (!this.updating) this.forceUpdate();

    return didRoute;
  }

  componentWillMount() {
    ROUTERS.push(this);
    this.updating = true;
  }

  componentDidMount() {
    if (customHistory) {
      this.unlisten = customHistory.listen((location) => {
        this.routeTo(`${location.pathname || ""}${location.search || ""}`);
      });
    }
    this.updating = false;
  }

  componentWillUnmount() {
    if (typeof this.unlisten === "function") this.unlisten();
    ROUTERS.splice(ROUTERS.indexOf(this), 1);
  }

  componentWillUpdate() {
    this.updating = true;
  }

  componentDidUpdate() {
    this.updating = false;
  }

  getMatchingChildren(
    children: VNode<RoutableProps>[],
    url: string,
    invoke: boolean,
  ): VNode<RoutableProps>[] {
    return children
      .map(prepareVNodeForRanking)
      .sort(pathRankSort)
      .map((vnode) => {
        let matches = exec(url, vnode.props.path, vnode.props);
        if (matches) {
          if (invoke !== false) {
            let newProps = { url, matches };
            assign(newProps, matches);
            // @ts-expect-error !
            delete newProps.ref;
            // @ts-expect-error !
            delete newProps.key;
            return cloneElement(vnode, newProps);
          }
          return vnode;
        }
      }).filter(Boolean) as VNode<RoutableProps>[];
  }

  render({ children, onChange }: RouterProps, { url }: RouterState) {
    let active = this.getMatchingChildren(
      toChildArray(children) as VNode<RoutableProps>[],
      url,
      true,
    );

    let current = active[0] || null;

    let previous = this.previousUrl;
    if (url !== previous) {
      this.previousUrl = url;
      if (typeof onChange === "function") {
        onChange({
          router: this,
          url,
          previous,
          active,
          current,
        });
      }
    }

    return current;
  }
}

// deno-lint-ignore no-explicit-any
const Route = (props: any) => createElement(props.component, props);

export { exec, getCurrentUrl, Route, route, Router, subscribers };
export default Router;
