import { computeMetrics, detectAnomalies } from "./metrics";
import { computeEnhancedStats, generateInsights } from "./ai/engine";

export type DemoScenario = "studio" | "personal";
export type DemoTransaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
};

export const scenarios = {
  studio: {
    name: "Northstar Studio",
    subtitle: "A small creative business",
    initials: "NS",
  },
  personal: {
    name: "Everyday life",
    subtitle: "A personal spending snapshot",
    initials: "EL",
  },
} as const;

// Deterministic, fictional fixtures. No personal data or network requests.
export function createDemoTransactions(
  scenario: DemoScenario,
): DemoTransaction[] {
  const rows: DemoTransaction[] = [];
  for (let month = 1; month <= 6; month++) {
    const add = (
      day: number,
      description: string,
      category: string,
      amount: number,
    ) => {
      rows.push({
        id: `${scenario}-${month}-${rows.length}`,
        date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        description,
        category,
        amount,
      });
    };
    if (scenario === "studio") {
      add(1, "Client retainer", "Income", 6800 + month * 260);
      add(3, "Studio rent", "Workspace", -1450);
      add(5, "Project milestone", "Income", 2400 + month * 180);
      add(6, "Design software", "Software", -189);
      add(8, "Cloud infrastructure", "Cloud hosting", -(180 + month * 24));
      add(10, "Contract design support", "Contractors", -(1200 + month * 45));
      add(12, "Team lunch", "Food & dining", -(95 + month * 13));
      add(15, "Product subscription", "Software", -79);
      add(18, "Campaign spend", "Marketing", -(380 + month * 36));
      add(21, "Client meeting travel", "Travel", -(140 + month * 12));
      add(24, "Bookkeeping", "Operations", -120);
      add(27, "Internet & utilities", "Operations", -165);
      if (month === 4) add(16, "Workstation replacement", "Equipment", -3200);
    } else {
      add(1, "Monthly salary", "Income", 5200);
      add(3, "Apartment rent", "Housing", -1600);
      add(5, "Weekly groceries", "Groceries", -(135 + month * 6));
      add(8, "Transport pass", "Transport", -110);
      add(10, "Weekend dining", "Food & dining", -(180 + month * 26));
      add(12, "Music & streaming", "Subscriptions", -32);
      add(15, "Weekly groceries", "Groceries", -(145 + month * 4));
      add(18, "Fitness membership", "Wellbeing", -89);
      add(21, "Internet & electricity", "Utilities", -180);
      add(24, "Coffee & lunches", "Food & dining", -(110 + month * 15));
      add(27, "Weekend shopping", "Shopping", -(160 + month * 30));
      add(28, "Freelance illustration", "Income", 450 + month * 30);
      if (month === 4) add(16, "Holiday booking", "Travel", -1250);
    }
  }
  return rows.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

export function analyseDemo(rows: DemoTransaction[]) {
  const transactions = rows.map((row) => ({
    ...row,
    date: new Date(`${row.date}T00:00:00Z`),
  }));
  const metrics = computeMetrics(transactions);
  const anomalies = detectAnomalies(transactions);
  return {
    metrics,
    anomalies,
    stats: computeEnhancedStats(metrics),
    insights: generateInsights(metrics, anomalies),
  };
}

export function transactionsToCsv(rows: DemoTransaction[]) {
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  return [
    "date,description,category,amount",
    ...rows.map((row) =>
      [row.date, row.description, row.category, row.amount.toFixed(2)]
        .map(escape)
        .join(","),
    ),
  ].join("\r\n");
}
