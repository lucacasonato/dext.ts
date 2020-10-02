// deno-lint-ignore triple-slash-reference
/// <reference types="./preact-async-router.d.ts" />

import { Component, h } from "../preact/mod.ts";

class AsyncRoute extends Component {
  constructor() {
    super();
    this.state = {
      componentData: null,
    };
  }
  loadComponent() {
    if (this.props.component) {
      return this.setState({
        componentData: this.props.component,
      });
    }
    const componentData = this.props.getComponent(
      this.props.url,
      ({ component }) => {
        // Named param for making callback future proof
        if (component) {
          this.setState({
            componentData: component,
          });
        }
      },
      Object.assign({}, this.props, this.props.matches),
    );

    // In case returned value was a promise
    if (componentData && componentData.then) {
      // IIFE to check if a later ending promise was creating a race condition
      // Check test case for more info
      ((url) => {
        componentData.then((component) => {
          if (url !== this.props.url) {
            this.setState({ componentData: null }, () => {
              this.loadComponent();
            });
            return;
          }
          this.setState({
            componentData: component,
          });
        });
      })(this.props.url);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.path && this.props.path !== nextProps.path) {
      this.setState(
        {
          componentData: null,
        },
        () => {
          this.loadComponent();
        },
      );
    }
  }
  componentWillMount() {
    this.loadComponent();
  }
  render() {
    if (this.state.componentData) {
      return h(this.state.componentData, this.props);
    } else if (this.props.loading) {
      const loadingComponent = this.props.loading();
      return loadingComponent;
    }
    return null;
  }
}

export default AsyncRoute;
