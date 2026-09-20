interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

export async function getPublicHolidays(countryCode: string, year?: number) {
  const code = countryCode.toUpperCase();
  const resolvedYear = year ?? new Date().getFullYear();

  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${resolvedYear}/${code}`);
  if (!response.ok) {
    throw new Error(`Public holidays lookup failed (${response.status})`);
  }

  const data = (await response.json()) as NagerHoliday[];

  return {
    country_code: code,
    year: resolvedYear,
    holidays: data.map((h) => ({ date: h.date, name: h.name, local_name: h.localName })),
  };
}
