export interface GetStaticDataContext {
  route?: Record<string, string | string[]>;
}

export interface GetStaticPaths {
  pages: GetStaticPathsPage[];
}

export interface GetStaticPathsPage {
  route: Record<string, string | string[]>;
}
