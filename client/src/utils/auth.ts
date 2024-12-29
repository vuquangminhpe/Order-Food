export const localStorageEventTarget = new EventTarget()
export const saveAccessTokenToLS = (access_token: string) => {
  localStorage.setItem('access_token', access_token)
}

export const clearLocalStorage = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('profile')
  const clearLSEvent = new Event('clearLocalStorage')
  localStorageEventTarget.dispatchEvent(clearLSEvent)
}

export const getAccessTokenFromLS = () => localStorage.getItem('access_token') || null

export const getProfileFormLS = () => {
  const result = localStorage.getItem('profile')

  return result ? JSON.parse(result) : null
}

export const setProfileFromLS = (profile: any) => {
  localStorage.setItem('profile', JSON.stringify(profile))
}
