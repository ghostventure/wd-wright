"use client";

import { submitWrightLead } from "./wd-wright-backend.js";

export async function submitLead(type, payload, options = {}) {
  return submitWrightLead(type, payload, options);
}
