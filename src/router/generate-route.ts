import type { RouteRecordRaw } from 'vue-router'
import type { MenuData, MenuDataItem } from '~@/layouts/basic-layout/typing'
import { isUrl } from '@v-c/utils'
import { omit } from 'lodash'
import { i18n } from '~@/locales'
import { ROOT_ROUTE_REDIRECT_PATH } from '~@/router/constant'
import dynamicRoutes from '~@/router/dynamic-routes'
import { basicRouteMap, getRouterModule } from './router-modules'

let cache_key = 1

const getCacheKey = () => `Cache_Key_${cache_key++}`

function renderTitle(route: RouteRecordRaw) {
  const { title, locale } = route.meta || {}
  if (!title)
    return ''
  return locale ? (i18n.global as any).t(locale) : title // Get Locale definitions from en-US.ts
}

function formatMenu(route: RouteRecordRaw, path?: string) {
  return {
    id: route.meta?.id,
    parentId: route.meta?.parentId,
    title: () => renderTitle(route),
    icon: route.meta?.icon || '',
    path: path ?? route.path,
    hideInMenu: route.meta?.hideInMenu || false,
    parentKeys: route.meta?.parentKeys || [],
    hideInBreadcrumb: route.meta?.hideInBreadcrumb || false,
    hideChildrenInMenu: route.meta?.hideChildrenInMenu || false,
    locale: route.meta?.locale,
    keepAlive: route.meta?.keepAlive || false,
    name: route.name as string,
    url: route.meta?.url || '',
    target: route.meta?.target || '_blank',
  }
}

// Local static route generation menu information
export function genRoutes(routes: RouteRecordRaw[], parent?: MenuDataItem) {
  const menuData: MenuData = []
  routes.forEach((route) => {
    let path = route.path
    if (!path.startsWith('/') && !isUrl(path)) {
      // Determine whether the current address starts with /. If not, it means that the current routing address is an incomplete address.
      if (parent)
        path = `${parent.path}/${path}`
      else
        path = `/${path}`
    }
    // Determine whether the name exists. If the name does not exist, automatically add a custom name. In order to more easily implement the keep-alive function, the name is required
    if (!route.name)
      route.name = getCacheKey()
    const item: MenuDataItem = formatMenu(route, path)
    item.children = []
    if (route.children && route.children.length)
      item.children = genRoutes(route.children, item)
    if (item.children?.length === 0)
      delete item.children
    menuData.push(item)
  })
  return menuData
}

/**
 * The menu information obtained by requesting the backend data is flattened by default, and the data needs to be organized into a tree structure
 */
export function generateTreeRoutes(menus: MenuData) {
  const routeDataMap = new Map<string | number, RouteRecordRaw>()
  const menuDataMap = new Map<string | number, MenuDataItem>()
  for (const menuItem of menus) {
    if (!menuItem.id)
      continue
    const route = {
      path: menuItem.path,
      name: menuItem.name || getCacheKey(),
      component: getRouterModule(menuItem.component!),
      redirect: menuItem.redirect || undefined,
      meta: {
        title: menuItem?.title as string,
        icon: menuItem?.icon as string,
        keepAlive: menuItem?.keepAlive,
        id: menuItem?.id,
        parentId: menuItem?.parentId,
        affix: menuItem?.affix,
        parentKeys: menuItem?.parentKeys,
        url: menuItem?.url,
        hideInMenu: menuItem?.hideInMenu,
        hideChildrenInMenu: menuItem?.hideChildrenInMenu,
        hideInBreadcrumb: menuItem?.hideInBreadcrumb,
        target: menuItem?.target,
        locale: menuItem?.locale,
      },
    } as RouteRecordRaw
    const menu = formatMenu(route)
    routeDataMap.set(menuItem.id, route)
    menuDataMap.set(menuItem.id, menu)
  }
  const routeData: RouteRecordRaw[] = []
  const menuData: MenuData = []

  for (const menuItem of menus) {
    if (!menuItem.id)
      continue
    const currentRoute = routeDataMap.get(menuItem.id)
    const currentItem = menuDataMap.get(menuItem.id)
    if (!menuItem.parentId) {
      if (currentRoute && currentItem) {
        routeData.push(currentRoute)
        menuData.push(currentItem)
      }
    }
    else {
      const pRoute = routeDataMap.get(menuItem.parentId)
      const pItem = menuDataMap.get(menuItem.parentId)
      if (currentItem && currentRoute && pRoute && pItem) {
        if (pRoute.children && pItem.children) {
          pRoute.children.push(currentRoute)
          pItem.children.push(currentItem)
        }
        else {
          pItem.children = [currentItem]
          pRoute.children = [currentRoute]
        }
      }
    }
  }
  return {
    menuData,
    routeData,
  }
}

/**
 * Dynamically generate menus and data through dynamic-routes in front-end data
 */

export async function generateRoutes() {
  const { hasAccess } = useAccess()
  function filterRoutesByAccess(routes: RouteRecordRaw[]) {
    return routes
      .filter((route) => {
        return !route.meta?.access || hasAccess(route.meta?.access)
      })
      .map((route) => {
        if (route.children?.length) {
          route.children = filterRoutesByAccess(route.children)
        }
        return route
      })
  }
  const accessRoutes = filterRoutesByAccess(dynamicRoutes)
  const menuData = genRoutes(accessRoutes)

  return {
    menuData,
    routeData: dynamicRoutes,
  }
}

function checkComponent(component: RouteRecordRaw['component']) {
  for (const componentKey in basicRouteMap) {
    if (component === (basicRouteMap as any)[componentKey])
      return undefined
  }
  return component
}

// Route flattening
function flatRoutes(routes: RouteRecordRaw[], parentName?: string, parentComps: RouteRecordRaw['component'][] = []) {
  const flatRouteData: RouteRecordRaw[] = []
  for (const route of routes) {
    const parentComponents = [...parentComps]
    const currentRoute = omit(route, ['children']) as RouteRecordRaw
    if (!currentRoute.meta)
      currentRoute.meta = {}
    if (parentName)
      currentRoute.meta.parentName = parentName
    if (parentComponents.length > 0)
      currentRoute.meta.parentComps = parentComponents
    currentRoute.meta.originPath = currentRoute.path
    flatRouteData.push(currentRoute)
    if (route.children && route.children.length) {
      const comp = checkComponent(route.component)
      if (comp)
        parentComponents.push(comp)
      flatRouteData.push(...flatRoutes(route.children, route.name as string, [...parentComponents]))
    }
  }
  return flatRouteData
}

export function generateFlatRoutes(routes: RouteRecordRaw[]) {
  const flatRoutesList = flatRoutes(routes)
  // Get the flattened route, then add a parent route to achieve the keep-alive function through this layer of routing
  const parentRoute: RouteRecordRaw = {
    path: '/',
    redirect: ROOT_ROUTE_REDIRECT_PATH,
    name: 'ROOT_EMPTY_PATH',
    // fix: https://github.com/antdv-pro/antdv-pro/issues/179
    // component: getRouterModule('RouteView'),
    children: flatRoutesList,
  }
  return [parentRoute]
}
