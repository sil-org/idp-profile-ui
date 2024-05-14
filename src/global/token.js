import Cookies from 'js-cookie'

init()

export default {
  key: () => get('key'),
  authzHeader: () => `${get('token_type')} ${apiToken()}`,
  reset,
  accessToken: () => get('access_token'),
  setAccessToken: (t) => Cookies.set('access_token', t, { expires: 7, path: '/' }),
  apiToken,
}

function init() {
  set('key', createKey())
  set('token_type', 'Bearer')
  set('access_token')
}

function createKey() {
  return Math.random() // doesn't need to be cryptographically strong
    .toString(36) // convert to base-36 so we get more letters
    .substring(2) // strip off the leading '0.'
}

function get(key) {
  // TODO: currently no IE support for URLSearchParams (https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#Browser_compatibility)
  // check this out for further info:  https://developers.google.com/web/updates/2016/01/urlsearchparams
  // polyfill if needed (https://github.com/jerrybendy/url-search-params-polyfill) or the WebReflection one...
  const defragged = new URL(location.href.replace('#', ''))
  const params = new URLSearchParams(defragged.search)

  return Cookies.get(key) || params.get(key)
}

function set(key, defaultValue = '') {
  Cookies.set(key, get(key) || defaultValue, { expires: 7, path: '/' })
}

function reset() {
  Cookies.remove('token_type')
  Cookies.remove('access_token')
}

function apiToken() {
  return get('key') + get('access_token')
}
