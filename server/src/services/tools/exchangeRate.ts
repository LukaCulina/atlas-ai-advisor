interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function getExchangeRate(from: string, to: string, amount = 1) {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  const url = new URL("https://api.frankfurter.dev/v1/latest");
  url.searchParams.set("base", fromCode);
  url.searchParams.set("symbols", toCode);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Exchange rate lookup failed (${response.status})`);
  }

  const data = (await response.json()) as FrankfurterResponse;
  const rate = data.rates[toCode];
  if (rate === undefined) {
    throw new Error(`No exchange rate found for ${fromCode} to ${toCode}`);
  }

  return {
    from: fromCode,
    to: toCode,
    amount,
    converted: Number((rate * amount).toFixed(4)),
    rate,
    date: data.date,
  };
}
