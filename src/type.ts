export interface PageProps<T = unknown> {
  route?: Record<string, string | string[]>;
  isFallback: boolean;
  data: T;
}

export interface GetStaticData<T = unknown> {
  data: T;
}
