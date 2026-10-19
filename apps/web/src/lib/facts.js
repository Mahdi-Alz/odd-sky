const MIN_YEARS = 5;

const isRainy = (d) => d.rain >= 1;
const isSnowy = (d) => d.snow > 0.1;
const isCloudy = (d) => d.cloud >= 70;
const isClear = (d) => d.cloud <= 20;

const extremes = [
  { group: "high-up", field: "high", today: "max", dir: 1, label: "Warmest {day}", tone: "warm" },
  {
    group: "high-down",
    field: "high",
    today: "max",
    dir: -1,
    label: "Coolest {day}",
    tone: "cool",
  },
  {
    group: "low-up",
    field: "low",
    today: "min",
    dir: 1,
    label: "Warmest {day} night",
    tone: "warm",
  },
  {
    group: "low-down",
    field: "low",
    today: "min",
    dir: -1,
    label: "Coldest {day} night",
    tone: "cool",
  },
  {
    group: "wind",
    field: "wind",
    today: "wind",
    dir: 1,
    label: "Windiest {day}",
    tone: "neutral",
    when: (d) => d.wind >= 20,
  },
  {
    group: "rain",
    field: "rain",
    today: "rain",
    dir: 1,
    label: "Wettest {day}",
    tone: "wet",
    when: isRainy,
  },
  {
    group: "snow",
    field: "snow",
    today: "snow",
    dir: 1,
    label: "Snowiest {day}",
    tone: "cool",
    when: isSnowy,
  },
  {
    group: "cloud",
    field: "cloud",
    today: "cloud",
    dir: 1,
    label: "Cloudiest {day}",
    tone: "neutral",
    when: isCloudy,
  },
  {
    group: "cloud",
    field: "cloud",
    today: "cloud",
    dir: -1,
    label: "Clearest {day}",
    tone: "warm",
    when: isClear,
  },
  {
    group: "month-high",
    field: "monthHigh",
    soFar: "high",
    today: "max",
    dir: 1,
    label: "Hottest {month} day",
    tone: "warm",
  },
  {
    group: "month-low",
    field: "monthLow",
    soFar: "low",
    today: "min",
    dir: -1,
    label: "Coldest {month} night",
    tone: "cool",
  },
];

const firsts = [
  { group: "rain", test: isRainy, label: "First rainy {day}", tone: "wet" },
  { group: "snow", test: isSnowy, label: "First snowy {day}", tone: "cool" },
  { group: "cloud", test: isCloudy, label: "First cloudy {day}", tone: "neutral" },
  { group: "cloud", test: isClear, label: "First clear {day}", tone: "warm" },
];

const pastDay = (e) => ({ rain: e.rain, snow: e.snow, cloud: e.cloud });

const sinceText = (label, match, years) =>
  match ? `${label} since ${match.year}` : `${label} in ${years.length} years`;

const yearsAgo = (match, years, currentYear) =>
  match ? currentYear - match.year : years.length + 1;

export const buildFacts = (today, history, localDate) => {
  const date = new Date(`${localDate}T00:00`);
  const currentYear = date.getFullYear();
  const fill = (label) =>
    label
      .replace("{day}", date.toLocaleDateString("en-us", { month: "short", day: "numeric" }))
      .replace("{month}", date.toLocaleDateString("en-us", { month: "long" }));

  const { years } = history;
  const facts = [];

  for (const rule of extremes) {
    const value = today[rule.today];
    if (value == null || (rule.when && !rule.when(today))) continue;
    if (
      rule.soFar &&
      history.monthSoFar &&
      (history.monthSoFar[rule.soFar] - value) * rule.dir >= 0
    )
      continue;
    const match = years.find(
      (e) => e[rule.field] != null && (e[rule.field] - value) * rule.dir >= 0,
    );
    const ago = yearsAgo(match, years, currentYear);
    if (ago < MIN_YEARS) continue;
    facts.push({
      group: rule.group,
      tone: rule.tone,
      text: sinceText(fill(rule.label), match, years),
      score: ago * (rule.group.startsWith("month") ? 4 : 3),
    });
  }

  for (const rule of firsts) {
    if (!rule.test(today)) continue;
    const match = years.find((e) => rule.test(pastDay(e)));
    const ago = yearsAgo(match, years, currentYear);
    if (ago < MIN_YEARS) continue;
    facts.push({
      group: rule.group,
      tone: rule.tone,
      text: sinceText(fill(rule.label), match, years),
      score: ago * 3 + 1,
    });
  }

  const rainyYears = years.filter((e) => isRainy(pastDay(e))).length;
  if (!isRainy(today) && rainyYears / years.length >= 0.5) {
    facts.push({
      group: "rain",
      tone: "neutral",
      text: `Usually rains on ${fill("{day}")} (${rainyYears} of ${years.length} years), not today`,
      score: (rainyYears / years.length) * 30,
    });
  }

  const best = new Map();
  for (const fact of facts) {
    if (!best.has(fact.group) || best.get(fact.group).score < fact.score)
      best.set(fact.group, fact);
  }
  return [...best.values()].sort((a, b) => b.score - a.score);
};
