// Viewer region inference. We never touch IP addresses — the visitor's
// timezone is enough to show a useful region breakdown in the admin panel.

const TZ_COUNTRY: Record<string, string> = {
  // North America
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Honolulu': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Mexico_City': 'MX',
  'America/Costa_Rica': 'CR',
  'America/Panama': 'PA',
  'America/Guatemala': 'GT',
  'America/Managua': 'NI',
  'America/Santo_Domingo': 'DO',
  'America/Havana': 'CU',
  'America/Puerto_Rico': 'PR',
  // South America
  'America/Sao_Paulo': 'BR',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  'America/Buenos_Aires': 'AR',
  'America/Caracas': 'VE',
  'America/La_Paz': 'BO',
  'America/Guayaquil': 'EC',
  'America/Montevideo': 'UY',
  'America/Asuncion': 'PY',
  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Dublin': 'IE',
  'Europe/Lisbon': 'PT',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Helsinki': 'FI',
  'Europe/Athens': 'GR',
  'Europe/Istanbul': 'TR',
  'Europe/Moscow': 'RU',
  'Europe/Kyiv': 'UA',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  // Middle East / Asia
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN',
  'Asia/Dubai': 'AE',
  'Asia/Jerusalem': 'IL',
  'Asia/Bangkok': 'TH',
  'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID',
  'Asia/Taipei': 'TW',
  'Asia/Karachi': 'PK',
  'Asia/Riyadh': 'SA',
  'Asia/Tehran': 'IR',
  // Oceania / Africa
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Casablanca': 'MA',
};

const CONTINENT_FALLBACK: Record<string, string> = {
  America: 'Americas',
  Europe: 'Europe',
  Asia: 'Asia',
  Africa: 'Africa',
  Australia: 'Oceania',
  Pacific: 'Oceania',
  Atlantic: 'Atlantic',
  Indian: 'Indian',
};

export function regionFromTimezone(tz?: string): string {
  if (!tz) return 'Unknown';
  const country = TZ_COUNTRY[tz];
  if (country) return country;
  const top = tz.split('/')[0];
  return CONTINENT_FALLBACK[top] || 'Other';
}

export function currentRegion(): string {
  try {
    return regionFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return 'Unknown';
  }
}
