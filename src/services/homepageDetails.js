const HOMEPAGE_DETAILS_URL = `${import.meta.env.VITE_API_BASE_URL}/api/nearby-explorer`;

export async function getPlaceHomepageDetails(thirdPartyApiResponse) {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const res = await fetch(HOMEPAGE_DETAILS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thirdPartyApiResponse),
  });

  if (!res.ok) {
    throw new Error(`Homepage details API HTTP ${res.status}: ${res.statusText}`);
  }

  const { data } = await res.json();
  if (!data || typeof data.summary !== 'string' || !Array.isArray(data.lines)) {
    throw new Error('Homepage details API returned an invalid response');
  }

  return data;
}
