const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const routes = [
  "/",
  "/about",
  "/services",
  "/technology",
  "/locations",
  "/resources",
  "/careers",
  "/contact",
  "/quote",
  "/signin",
  "/home",
  "/help",
  "/faq",
  "/press",
  "/privacy",
  "/terms",
  "/accessibility",
  "/dmca",
  "/invest",
];

const failures = [];

for (const route of routes) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url, { redirect: "follow" });
    const text = await response.text();
    const ok = response.status === 200;
    const looksLikeError = /Cannot find module|Internal Server Error|__NEXT_DATA__/.test(text);
    if (!ok || looksLikeError) {
      failures.push({
        route,
        status: response.status,
        detail: looksLikeError ? "error payload detected" : "unexpected status",
      });
      continue;
    }
    console.log(`OK  ${response.status} ${route}`);
  } catch (error) {
    failures.push({
      route,
      status: "ERR",
      detail: error instanceof Error ? error.message : "request failed",
    });
  }
}

if (failures.length) {
  console.error("Smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure.route}: ${failure.status} ${failure.detail}`);
  }
  process.exit(1);
}

console.log("Smoke test passed.");
