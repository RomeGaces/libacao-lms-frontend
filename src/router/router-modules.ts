const routerModules = import.meta.glob([
  '~/pages/**/*.vue',
  '!~/pages/**/*copy.vue',
  '!~/pages/**/component',
  '!~/pages/**/components',
  '!~/pages/**/composables',
  '!~/pages/**/hooks',
  '!~/pages/**/locales',
  '!~/pages/**/modules',
  '!~/pages/**/plugins',
  '!~/pages/**/tests',
  '!~/pages/**/test',
  '!~/pages/common',
])
export const basicRouteMap = {
  // iframe模式下使用
  Iframe: () => import('~/pages/common/iframe.vue'),
  // 一般用于存在子集的页面
  RouteView: () => import('~/layouts/components/route-view.vue'),
  // 空页面
  ComponentError: () => import('~/pages/exception/component-error.vue'),
}

function checkEager(module: any) {
  if (typeof module === 'object' && 'default' in module)
    return module.default

  return module
}
export function getRouterModule(path?: string): any {
  if (!path)
    return basicRouteMap.ComponentError
  // Determine whether it exists in basicRouteMap
  if (path in basicRouteMap)
    return (basicRouteMap as any)[path]

  // Determine whether it starts with /
  if (path.startsWith('/'))
    path = path.slice(1)
  // Assembled data format
  const fullPath = `/resources/js/LMS/pages/${path}.vue`
  const fullPathIndex = `/resources/js/LMS/pages/${path}/index.vue`
  if (fullPathIndex in routerModules)
    return checkEager(routerModules[fullPathIndex])

  // Return plug-in information
  return checkEager(routerModules[fullPath])
}

export default routerModules
