import dayjs from 'dayjs'
import { i18n, loadLanguageAsync } from '~@/locales'
import router from '~@/router'
import { useMetaTitle } from '~/composables/meta-title'
import 'dayjs/locale/zh-cn'

const LOCALE_KEY = 'locale'

export const preferredLanguages = usePreferredLanguages()

export const lsLocaleState = useStorage(LOCALE_KEY, preferredLanguages.value[0])

export const useI18nLocale = createSharedComposable(() => {
  // Loading state of multiple languages
  const loading = ref(false)
  const localeStore = useAppStore()
  // Multilingual information
  const locale = computed<string>(() => {
    if (!i18n)
      return 'en-US'

    return unref(i18n.global.locale)
  })

  // Get antd's multi-language
  const antd = computed(() => {
    return (i18n?.global?.getLocaleMessage?.(unref(locale)) as any)?.antd || undefined
  })

  // Switch multiple languages
  const setLocale = async (locale: string) => {
    if (!i18n)
      return

    if (loading.value)
      return
    loading.value = true
    try {
      // Load multiple languages
      localeStore.toggleLocale(locale)
      await loadLanguageAsync(locale)
      // Determine whether compatibility mode exists
      if (i18n.mode === 'legacy')
        i18n.global.locale = locale as any
      else
        (i18n.global.locale as any).value = locale as any
      loading.value = false
    }
    catch (e) {
      loading.value = false
    }
  }

  watch(locale, () => {
    if (antd.value && antd.value.locale)
      dayjs.locale(antd.value.locale)

    const route = router.currentRoute.value
    useMetaTitle(route)
  }, {
    immediate: true,
  })

  // Switching multi-language function
  const t = (key: string, defaultMessage?: string) => {
    const message = (i18n?.global as any)?.t?.(key)
    if (message !== key)
      return (i18n?.global as any)?.t?.(key)
    else
      return defaultMessage ?? key
  }
  return {
    locale,
    t,
    antd,
    setLocale,
  }
})
