function cleanString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

function toSlug(value = "") {
  return cleanString(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}

export function resolveCoverageArea(payload = {}) {
  const location = cleanString(payload.location || payload.projectLocation || "", 160).toLowerCase();

  if (/(north carolina|raleigh|charlotte|durham|greensboro|asheville|wilmington|kannapolis)/.test(location)) {
    return { region: "north-carolina", officeCode: "nc-core", timezone: "America/New_York", market: "North Carolina" };
  }
  if (/(florida|jacksonville|orlando|ocala|sarasota|clearwater|casselberry)/.test(location)) {
    return { region: "florida", officeCode: "fl-core", timezone: "America/New_York", market: "Florida" };
  }
  if (/(pennsylvania|pittsburgh|harrisburg|york|greensburg|washington|beaver)/.test(location)) {
    return { region: "pennsylvania", officeCode: "pa-core", timezone: "America/New_York", market: "Pennsylvania" };
  }
  if (/(virginia|richmond|manassas|staunton)/.test(location)) {
    return { region: "virginia", officeCode: "va-core", timezone: "America/New_York", market: "Virginia" };
  }
  if (/(ohio|columbus|cincinnati|findlay|medina)/.test(location)) {
    return { region: "ohio", officeCode: "oh-core", timezone: "America/New_York", market: "Ohio" };
  }
  if (/(indiana|indianapolis|bloomington|jeffersonville|kokomo)/.test(location)) {
    return { region: "indiana", officeCode: "in-core", timezone: "America/Indiana/Indianapolis", market: "Indiana" };
  }

  return { region: "general", officeCode: "national-desk", timezone: "America/New_York", market: "General Coverage" };
}

export function routeOffice(coverage = {}, payload = {}) {
  const service = cleanString(payload.service || payload.serviceType || "", 120).toLowerCase();
  let queue = "general-intake";
  if (service.includes("flag")) queue = "flagging";
  else if (service.includes("plan") || service.includes("mot") || service.includes("tcp")) queue = "planning";
  else if (service.includes("tma")) queue = "tma";
  else if (service.includes("event")) queue = "event-closures";
  else if (service.includes("smart") || service.includes("afad")) queue = "smart-work-zone";

  const priorityScore = queue === "planning" || queue === "tma" ? 78 : queue === "flagging" ? 64 : 42;
  return {
    region: coverage.region || "general",
    queue,
    officeHint: coverage.officeCode || coverage.region || "general",
    market: coverage.market || "General Coverage",
    priority: priorityScore >= 70 ? "priority" : "standard",
    priorityScore,
  };
}

export function isAfterHours(coverage = {}, now = new Date()) {
  const regionNow = new Date(now);
  const hour = regionNow.getHours();
  return hour < 6 || hour >= 18;
}

export function createDispatchRequest(type, payload = {}) {
  const coverage = resolveCoverageArea(payload);
  const route = routeOffice(coverage, payload);
  const afterHours = isAfterHours(coverage);
  const requestId = `wdw-dispatch-${toSlug(type)}-${Date.now().toString(36)}`;

  return {
    requestId,
    type: cleanString(type, 40),
    coverage,
    route,
    afterHours,
    escalationLevel: afterHours || route.priority === "priority" ? "dispatch-supervisor" : "office-coordinator",
    dispatchWindow: afterHours ? "after-hours" : "standard-hours",
  };
}

export function buildTimelineState(type, dispatchRequest = {}) {
  const base = [
    { key: "intake_received", label: "Intake Received", status: "complete" },
    { key: "dispatch_review", label: "Dispatch Review", status: "active" },
    { key: "crew_assignment", label: "Crew Assignment", status: "pending" },
    { key: "schedule_confirmation", label: "Schedule Confirmation", status: "pending" },
  ];
  if (String(type) === "quote-request") {
    base.push({ key: "quote_release", label: "Quote Release", status: "pending" });
  }
  if (dispatchRequest.afterHours) {
    base.splice(2, 0, { key: "after_hours_escalation", label: "After-Hours Escalation", status: "active" });
  }
  return base;
}

export function buildCrewAvailability(dispatchRequest = {}) {
  const queue = dispatchRequest?.route?.queue || "general-intake";
  const region = dispatchRequest?.coverage?.region || "general";
  return {
    region,
    queue,
    availableNow: !dispatchRequest.afterHours || queue === "flagging" || queue === "tma",
    crewBand: queue === "planning" ? "planner-led" : queue === "tma" ? "specialized" : "field-standard",
  };
}

export function buildJobSchedule(type, dispatchRequest = {}) {
  const targetHours = dispatchRequest?.route?.priorityScore >= 70 ? 2 : 6;
  return {
    type: cleanString(type, 40),
    targetWindowHours: targetHours,
    schedulingMode: dispatchRequest.afterHours ? "escalated" : "standard",
    firstTouchEta: `${targetHours}h`,
  };
}

export function forecastCapacity(dispatchRequest = {}) {
  const queue = dispatchRequest?.route?.queue || "general-intake";
  const priorityScore = Number(dispatchRequest?.route?.priorityScore || 0);
  const utilization = queue === "planning" ? 0.72 : queue === "tma" ? 0.81 : queue === "flagging" ? 0.64 : 0.51;
  return {
    region: dispatchRequest?.coverage?.region || "general",
    queue,
    utilization,
    forecast: priorityScore >= 70 ? "watchlist" : utilization >= 0.8 ? "tight" : "available",
  };
}

export function buildShiftStatusFeed(dispatchRequest = {}) {
  return [
    {
      type: "dispatch_received",
      status: "complete",
      queue: dispatchRequest?.route?.queue || "general-intake",
    },
    {
      type: dispatchRequest.afterHours ? "after_hours_watch" : "office_watch",
      status: "active",
      office: dispatchRequest?.route?.officeHint || "national-desk",
    },
  ];
}
