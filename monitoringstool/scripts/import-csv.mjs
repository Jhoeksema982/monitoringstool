import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const CSV_PATH = process.argv[2] || "oude-database-waarden.csv";

const raw = readFileSync(CSV_PATH, "utf-8").trim();
const lines = raw.split("\n");
const header = lines[0];
const rows = lines.slice(1).map(parseLine);

function parseLine(line) {
  const parts = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ";" && !inQuotes) { parts.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  parts.push(current.trim());
  return { datum: parts[0], locatie: parts[1], type: parts[2], vraag: parts[3], antwoord: parts[4] };
}

function normalizeTitle(title) {
  return title.replace(/vader\/moeder/g, "{parent}");
}

async function ensureQuestion(title) {
  const normalized = normalizeTitle(title);
  const { data: existing } = await supabase
    .from("questions")
    .select("uuid")
    .eq("title", normalized)
    .maybeSingle();

  if (existing) return existing.uuid;

  const uuid = uuidv4();
  const { error } = await supabase.from("questions").insert({
    uuid,
    title: normalized,
    priority: "medium",
    status: "active",
    type: "smiley",
    mode: "regular",
    age_group: "all",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  console.log(`  Vraag aangemaakt: ${normalized}`);
  return uuid;
}

function parseDate(datumStr) {
  const [datePart, timePart] = datumStr.split(", ");
  const [day, month, year] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");
  return new Date(+year, +month - 1, +day, +hour, +minute, +second).toISOString();
}

// --- Main ---

console.log(`\nInlezen: ${rows.length} rijen uit ${CSV_PATH}`);

// Step 1: question titles -> UUIDs
const questionTitles = [...new Set(rows.map(r => r.vraag))];
console.log(`\nStap 1: ${questionTitles.length} unieke vragen controleren/aamaken...`);
const titleToUuid = {};
for (const title of questionTitles) {
  const uuid = await ensureQuestion(title);
  titleToUuid[title] = uuid;
}

// Step 2: group into submissions
const groups = {};
for (const row of rows) {
  const key = `${row.datum}|${row.locatie}|${row.type}`;
  if (!groups[key]) groups[key] = { datum: row.datum, locatie: row.locatie, type: row.type, responses: [] };
  groups[key].responses.push(row);
}

const groupKeys = Object.keys(groups);
console.log(`\nStap 2: ${groupKeys.length} submissions importeren...`);

let importedCount = 0;
for (const key of groupKeys) {
  const g = groups[key];
  const submissionUuid = uuidv4();
  const createdAt = parseDate(g.datum);

  const { error: subError } = await supabase.from("submissions").insert({
    uuid: submissionUuid,
    survey_type: g.type === "ouder_kind" ? "ouder_kind" : g.type === "extra_vader_kind" ? "extra_vader_kind" : "regular",
    location: g.locatie,
    created_at: createdAt,
  });
  if (subError) { console.error(`  Fout bij submission ${key}:`, subError.message); continue; }

  const responseRecords = g.responses.map(r => ({
    uuid: uuidv4(),
    submission_uuid: submissionUuid,
    question_uuid: titleToUuid[r.vraag],
    response_data: { value: r.antwoord, label: r.antwoord },
    user_identifier: null,
    survey_type: g.type === "ouder_kind" ? "ouder_kind" : g.type === "extra_vader_kind" ? "extra_vader_kind" : "regular",
  }));

  const { error: respError } = await supabase.from("responses").insert(responseRecords);
  if (respError) { console.error(`  Fout bij responses voor ${key}:`, respError.message); continue; }

  importedCount++;
  if (importedCount % 5 === 0) console.log(`  ${importedCount}/${groupKeys.length}...`);
}

console.log(`\n✅ Klaar! ${importedCount} submissions geïmporteerd (${rows.length} antwoorden).`);
process.exit(0);
