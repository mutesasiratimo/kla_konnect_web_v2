import faviconUrl from './assets/klakonnect_logo_clean.png'

export function setFavicon(): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = 'image/png'
  link.href = faviconUrl
}
