/// <reference types="./memo.d.ts" />

import { createElement } from "../../deps/preact/mod.ts";

export function shallowDiffers(a, b) {
  for (const i in a) if (i !== "__source" && !(i in b)) return true;
  for (const i in b) if (i !== "__source" && a[i] !== b[i]) return true;
  return false;
}

export function memo(c, comparer) {
  function shouldUpdate(nextProps) {
    const ref = this.props.ref;
    const updateRef = ref == nextProps.ref;
    if (!updateRef && ref) {
      ref.call ? ref(null) : (ref.current = null);
    }

    if (!comparer) {
      return shallowDiffers(this.props, nextProps);
    }

    return !comparer(this.props, nextProps) || !updateRef;
  }

  function Memoed(props) {
    this.shouldComponentUpdate = shouldUpdate;
    return createElement(c, props);
  }
  Memoed.displayName = "Memo(" + (c.displayName || c.name) + ")";
  Memoed.prototype.isReactComponent = true;
  Memoed._forwarded = true;
  return Memoed;
}
