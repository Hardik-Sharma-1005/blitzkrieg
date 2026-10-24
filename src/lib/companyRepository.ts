import { SEED_COMPANIES } from "@/data/seedCompanies";
import { asRecord, asString, type JsonRecord } from "@/lib/companyData";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export interface CompanyDirectoryRecord {
  company_id: number;
  short_json: JsonRecord;
}

export interface CompanyRecord extends CompanyDirectoryRecord {
  full_json: JsonRecord;
  skill_levels: JsonRecord[];
  topicsBySkillId: Record<number, string[]>;
  dataOrigin: "demo" | "supabase";
  skillDataWarnings: string[];
}

function withCompanyId(value: unknown, companyId: number): JsonRecord {
  return { ...asRecord(value), company_id: companyId };
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function throwIfError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export async function fetchCompanyDirectory(): Promise<CompanyDirectoryRecord[]> {
  if (!isSupabaseConfigured) {
    return SEED_COMPANIES.map((company) => ({
      company_id: company.company_id,
      short_json: withCompanyId(company.short_json, company.company_id),
    }));
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("company_json")
    .select("company_id, short_json")
    .order("company_id", { ascending: true });
  throwIfError(error, "Could not load the company directory");

  return (data ?? []).map((row) => ({
    company_id: Number(row.company_id),
    short_json: withCompanyId(row.short_json, Number(row.company_id)),
  }));
}

export async function fetchCompanyRecord(companyId: number): Promise<CompanyRecord | null> {
  if (!isSupabaseConfigured) {
    const seed = SEED_COMPANIES.find((company) => company.company_id === companyId);
    if (!seed) return null;
    return {
      company_id: seed.company_id,
      short_json: withCompanyId(seed.short_json, seed.company_id),
      full_json: asRecord(seed.full_json),
      skill_levels: seed.skill_levels.map((skill) => asRecord(skill)),
      topicsBySkillId: {},
      dataOrigin: "demo",
      skillDataWarnings: [],
    };
  }

  const client = requireSupabase();
  const companyResult = await client
    .from("company_json")
    .select("company_id, short_json, full_json")
    .eq("company_id", companyId)
    .maybeSingle();
  throwIfError(companyResult.error, "Could not load this company profile from company_json");
  if (!companyResult.data) return null;

  const skillDataWarnings: string[] = [];
  const skillLevelsResult = await client
    .from("company_skill_levels")
    .select("skill_set_id, required_level, required_proficiency_level_id")
    .eq("company_id", companyId);
  if (skillLevelsResult.error) {
    skillDataWarnings.push("Skill requirements are unavailable. Check public SELECT access to company_skill_levels.");
  }

  const skillRows = skillLevelsResult.data ?? [];
  const skillSetIds = [...new Set(skillRows.map((row) => Number(row.skill_set_id)).filter(Number.isFinite))];

  const [skillSetsResult, proficienciesResult] = skillSetIds.length
    ? await Promise.all([
        client.from("skill_set_master").select("skill_set_id, skill_set_name").in("skill_set_id", skillSetIds),
        client.from("proficiency_levels").select("proficiency_level_id, proficiency_name"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (skillSetsResult.error) skillDataWarnings.push("Some skill names are unavailable. Check public SELECT access to skill_set_master.");
  if (proficienciesResult.error) skillDataWarnings.push("Some proficiency labels are unavailable. Check public SELECT access to proficiency_levels.");

  const topicRowsResult = skillSetIds.length
    ? await client
        .from("skill_set_topics")
        .select("skill_set_id, level_number, topics")
        .in("skill_set_id", skillSetIds)
        .order("skill_set_id", { ascending: true })
        .order("level_number", { ascending: true })
    : { data: [], error: null };
  if (topicRowsResult.error) skillDataWarnings.push("Database skill roadmaps are unavailable; built-in roadmaps remain available where provided.");

  const skillNames = new Map(
    (skillSetsResult.data ?? []).map((row) => [Number(row.skill_set_id), asString(row.skill_set_name)]),
  );
  const proficiencyNames = new Map(
    (proficienciesResult.data ?? []).map((row) => [Number(row.proficiency_level_id), asString(row.proficiency_name)]),
  );
  const skillLevels = skillRows.map((row) => {
    const skillSetId = Number(row.skill_set_id);
    return {
      skill_set_id: skillSetId,
      skill_set_name: skillNames.get(skillSetId) || `Skill ${skillSetId}`,
      required_level: Number(row.required_level),
      required_proficiency: proficiencyNames.get(Number(row.required_proficiency_level_id)) || "",
    };
  });

  const topicsByLevel: Record<number, Map<number, string[]>> = {};
  for (const row of topicRowsResult.data ?? []) {
    const skillSetId = Number(row.skill_set_id);
    const level = Number(row.level_number);
    const topic = asString(row.topics);
    if (!skillSetIds.includes(skillSetId) || level < 1 || level > 10 || !topic) continue;
    topicsByLevel[skillSetId] ??= new Map<number, string[]>();
    const levelTopics = topicsByLevel[skillSetId].get(level) ?? [];
    levelTopics.push(topic);
    topicsByLevel[skillSetId].set(level, levelTopics);
  }

  const topicsBySkillId = Object.fromEntries(
    skillSetIds.map((id) => [
      id,
      Array.from({ length: 10 }, (_, index) => topicsByLevel[id]?.get(index + 1)?.join("; ") ?? ""),
    ]),
  ) as Record<number, string[]>;

  return {
    company_id: Number(companyResult.data.company_id),
    short_json: withCompanyId(companyResult.data.short_json, Number(companyResult.data.company_id)),
    full_json: asRecord(companyResult.data.full_json),
    skill_levels: skillLevels,
    topicsBySkillId,
    dataOrigin: "supabase",
    skillDataWarnings,
  };
}
