const PUBLIC_APP_URL = 'https://nearby-explorer-hazel.vercel.app';

export function getShareUrl() {
  return `${PUBLIC_APP_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
}
