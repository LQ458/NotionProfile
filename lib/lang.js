import { isBrowser, mergeDeep } from '@/lib/utils'
import enUS from './lang/en-US'
import frFR from './lang/fr-FR'
import jaJP from './lang/ja-JP'
import trTR from './lang/tr-TR'
import zhCN from './lang/zh-CN'
import zhHK from './lang/zh-HK'
import zhTW from './lang/zh-TW'
import { extractLangPrefix } from './utils/pageId'

/**
 * 在这里配置所有支持的语言
 * 国家-地区
 */
const LANGS = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
  'fr-FR': frFR,
  'tr-TR': trTR,
  'ja-JP': jaJP
}

export default LANGS

/**
 * 获取当前语言字典
 * 如果匹配到完整的"国家-地区"语言，则显示国家的语言
 * @returns 不同语言对应字典
 */
export function generateLocaleDict(langString) {
  const supportedLocales = Object.keys(LANGS)
  let userLocale

  // 将语言字符串拆分为语言和地区代码，例如将 "zh-CN" 拆分为 "zh" 和 "CN"
  const [language, region] = langString?.split(/[-_]/)

  // 优先匹配语言和地区都匹配的情况
  const specificLocale = `${language}-${region}`
  if (supportedLocales.includes(specificLocale)) {
    userLocale = LANGS[specificLocale]
  }

  // 然后尝试匹配只有语言匹配的情况
  if (!userLocale) {
    const languageOnlyLocales = supportedLocales.filter(locale =>
      locale.startsWith(language)
    )
    if (languageOnlyLocales.length > 0) {
      userLocale = LANGS[languageOnlyLocales[0]]
    }
  }

  // 如果还没匹配到，则返回最接近的语言包
  if (!userLocale) {
    const fallbackLocale = supportedLocales.find(locale =>
      locale.startsWith('en')
    )
    userLocale = LANGS[fallbackLocale]
  }

  return mergeDeep({}, LANGS['en-US'], userLocale)
}

/**
 * 简化语言判断逻辑,只根据路径判断
 * @returns {string|null}
 */
export function determineUserLang() {
  if (!isBrowser) return null

  // 只看路径第一段
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const pathLang = pathSegments[0]?.toLowerCase()
  
  // 只处理两种情况: /en 和 /
  return pathLang === 'en' ? 'en-US' : 'zh-CN'
}

/**
 * 站点翻译
 * 借助router中的locale机制，根据locale自动切换对应的语言
 */
export function initLocale(locale, changeLang, updateLocale) {
  if (!isBrowser) return

  const userLang = determineUserLang()
  if (!userLang) return

  changeLang(userLang)
  const targetLocale = generateLocaleDict(userLang)
  updateLocale(targetLocale)
}

/**
 * 读取语言
 * @returns {*}
 */
export const loadLangFromLocalStorage = () => {
  return localStorage.getItem('lang')
}

/**
 * 保存语言
 * @param newTheme
 */
export const saveLangToLocalStorage = lang => {
  localStorage.setItem('lang', lang)
}

/**
 *  检测用户的预研偏好，跳转至对应的多语言网站
 * @param {*} pageId
 *
 */
export const redirectUserLang = (pageId) => {
  if (!isBrowser) return
  if (!pageId?.includes(',')) return
  
  const currentPath = window.location.pathname
  const pathSegments = currentPath.split('/').filter(Boolean)
  const pathLang = pathSegments[0]?.toLowerCase()
  
  // 检查当前路径是否需要重定向
  const siteIds = pageId.split(',')
  for (const siteId of siteIds) {
    const prefix = extractLangPrefix(siteId)
    if (!prefix) continue
    
    const prefixLang = prefix.toLowerCase()
    // 如果是英文路径但不在 /en,或者是中文路径但不在 /
    if (
      (prefixLang === 'en' && pathLang !== 'en') ||
      (prefixLang === 'zh' && currentPath !== '/')
    ) {
      const targetPath = prefixLang === 'zh' ? '/' : '/en'
      window.location.href = targetPath
      break
    }
  }
}
