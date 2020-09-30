export interface PageProps<T = unknown> {
  route?: Record<string, string | string[]>;
  data: T;
}

export interface GetStaticDataContext {
  route?: Record<string, string | string[]>;
}

export interface GetStaticData<T = unknown> {
  data: T;
}

export interface GetStaticPaths {
  pages: GetStaticPathsPage[];
}

export interface GetStaticPathsPage {
  route: Record<string, string | string[]>;
}
