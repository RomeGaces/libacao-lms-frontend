import type { ExtractPropTypes, VNodeChild } from 'vue'
import { arrayType, booleanType, eventType, numberType, stringType } from '@v-c/utils'

export type CheckedType = boolean | string | number

export type Key = string | number

export type MenuData = MenuDataItem[]
export interface MenuDataItem {
  // 唯一id
  id?: string | number
  // 标题
  title: string | (() => VNodeChild)
  // 图标
  icon?: string | (() => VNodeChild)
  // 地址
  path: string
  // 绑定的哪个组件
  component?: string
  // 子集菜单
  children?: MenuDataItem[]
  // 重定向地址
  redirect?: string
  // 哪些是固定页签
  affix?: boolean
  // 父级菜单的id
  parentId?: string | number | null
  // Same as the name in the route, mainly used for keeping alive
  name?: string
  // 是否隐藏当前菜单
  hideInMenu?: boolean
  // If hidden is used, the parent's key can be used when clicking the current menu
  parentKeys?: string[]
  // 是否套用iframe
  isIframe?: boolean
  // If the current mode is iframe, a jump URL is required, which cannot be repeated with the path. The path is still a route.
  url?: string
  // Are there breadcrumbs present?
  hideInBreadcrumb?: boolean
  // Do you need to display all submenus?
  hideChildrenInMenu?: boolean
  // 是否保活
  keepAlive?: boolean
  // This includes all parent elements
  matched?: MenuDataItem[]
  // 全连接跳转模式
  target?: '_blank' | '_self' | '_parent'
  // Multi-language configuration
  locale?: string
}

export type LayoutType = 'mix' | 'side' | 'top'

export type ThemeType = 'light' | 'dark' | 'inverted'

export type ContentWidth = 'Fluid' | 'Fixed'

export interface MenuSelectEvent {
  item: any
  key: string
  selectedKeys: string[]
}

const proLayoutEvents = {
  'onUpdate:openKeys': eventType<(val: string[]) => void>(),
  'onUpdate:selectedKeys': eventType<(val: string[]) => void>(),
  'onMenuSelect': eventType<(data: MenuSelectEvent) => void>(),
}

export const proLayoutProps = {
  layout: stringType<LayoutType>('mix'),
  logo: stringType(),
  title: stringType(),
  collapsedWidth: numberType(48),
  siderWidth: numberType(234),
  headerHeight: numberType<number>(48),
  menuData: arrayType<MenuData>(),
  fixedHeader: booleanType<boolean>(false),
  fixedSider: booleanType<boolean>(true),
  splitMenus: booleanType(),
  collapsed: booleanType<boolean>(false),
  leftCollapsed: booleanType<boolean>(false),
  theme: stringType<ThemeType>('light'),
  onCollapsed: eventType<(collapsed: boolean) => void>(),
  isMobile: booleanType(),
  contentWidth: stringType<ContentWidth>(),
  header: booleanType<boolean>(true),
  footer: booleanType<boolean>(true),
  menu: booleanType<boolean>(true),
  menuHeader: booleanType<boolean>(true),
  // 展开菜单
  openKeys: arrayType<string[]>(),
  // 选中菜单
  selectedKeys: arrayType<string[]>(),
  copyright: stringType(),
  ...proLayoutEvents,
}

export type ProLayoutProps = Partial<ExtractPropTypes<typeof proLayoutProps>>
