export const operations = {
  list: (resource: string, query?: Record<string, any>) =>
    useGet(`/${resource}`, query),
  get: (resource: string, id: number | string) =>
    useGet(`/${resource}/${id}`),
  create: (resource: string, data: any) =>
    usePost(`/${resource}`, data),
  update: (resource: string, id: number | string, data: any) =>
    usePut(`/${resource}/${id}`, data),
  remove: (resource: string, id: number | string) =>
    useDelete(`/${resource}/${id}`),
}
