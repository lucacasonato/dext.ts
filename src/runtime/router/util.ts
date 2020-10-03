import type { VNode } from "../../../deps/preact/mod.ts";
import type { RoutableProps } from "./mod.ts";

const EMPTY: Record<number, string> = {};

export function assign<K extends string | number | symbol, V>(
  obj: Record<K, V>,
  props: Record<K, V>,
) {
  for (let i in props) {
    obj[i] = props[i];
  }
  return obj;
}

export function exec(url: string, route: string, opts: { default: boolean }) {
  let reg = /(?:\?([^#]*))?(#.*)?$/,
    c = url.match(reg),
    matches: Record<string, string> = {},
    ret;
  if (c && c[1]) {
    let p = c[1].split("&");
    for (let i = 0; i < p.length; i++) {
      let r = p[i].split("=");
      matches[decodeURIComponent(r[0])] = decodeURIComponent(
        r.slice(1).join("="),
      );
    }
  }
  const urlSegments = segmentize(url.replace(reg, ""));
  const routeSegments = segmentize(route || "");
  let max = Math.max(urlSegments.length, routeSegments.length);
  for (let i = 0; i < max; i++) {
    if (routeSegments[i] && routeSegments[i].charAt(0) === ":") {
      let param = routeSegments[i].replace(/(^:|[+*?]+$)/g, ""),
        flags = (routeSegments[i].match(/[+*?]+$/) || EMPTY)[0] || "",
        plus = ~flags.indexOf("+"),
        star = ~flags.indexOf("*"),
        val = urlSegments[i] || "";
      if (!val && !star && (flags.indexOf("?") < 0 || plus)) {
        ret = false;
        break;
      }
      matches[param] = decodeURIComponent(val);
      if (plus || star) {
        matches[param] = urlSegments.slice(i).map(decodeURIComponent).join("/");
        break;
      }
    } else if (routeSegments[i] !== urlSegments[i]) {
      ret = false;
      break;
    }
  }
  if (opts.default !== true && ret === false) return false;
  return matches;
}

export function pathRankSort(
  a: { rank: number; index: number },
  b: { rank: number; index: number },
) {
  return (
    (a.rank < b.rank) ? 1 : (a.rank > b.rank) ? -1 : (a.index - b.index)
  );
}

// filter out VNodes without attributes (which are unrankeable), and add `index`/`rank` properties to be used in sorting.
export function prepareVNodeForRanking(
  vnode: VNode<RoutableProps>,
  index: number,
): VNode<RoutableProps> & {
  index: number;
  rank: number;
} {
  return {
    ...vnode,
    index,
    rank: rankChild(vnode),
  };
}

export function segmentize(url: string) {
  return url.replace(/(^\/+|\/+$)/g, "").split("/");
}

export function rankSegment(segment: string) {
  return segment.charAt(0) == ":"
    ? (1 + "*+?".indexOf(segment.charAt(segment.length - 1))) || 4
    : 5;
}

export function rank(path: string): number {
  return parseInt(segmentize(path).map(rankSegment).join(""));
}

function rankChild(vnode: VNode<RoutableProps>) {
  return vnode.props.default ? 0 : rank(vnode.props.path);
}
