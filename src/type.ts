export interface PageProps<T = unknown> {
  route?: Record<string, string | string[]>;
  isFallback: boolean;
  data: T;
}

export interface GetStaticDataContext {
  route?: Record<string, string | string[]>;
}

export interface GetStaticData<T = unknown> {
  data: T;
}

export interface GetStaticPaths {
  pages: Record<string, string | string[]>[];
}
