// Remembers where the user was trying to go before being sent to the login page.
// Kept in sessionStorage so it survives the full-page redirect of Google sign-in.
const KEY = 'cetakbanner:returnTo'

export function setReturnTo(path) {
  if (path && path !== '/login' && path !== '/signup') sessionStorage.setItem(KEY, path)
}

export function clearReturnTo() {
  sessionStorage.removeItem(KEY)
}

// Read and remove the saved path in one go
export function consumeReturnTo() {
  const path = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  return path
}

