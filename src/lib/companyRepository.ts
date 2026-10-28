import { SEED_COMPANIES } from "@/data/seedCompanies";
import { ALL_118_COMPANIES } from "@/data/allCompaniesList";
import { asRecord, asString, type JsonRecord } from "@/lib/companyData";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export interface CompanyDirectoryRecord {
  company_id: number;
  short_json: JsonRecord;
  headquarters_address?: string;
  logo_url?: string;
  website_url?: string;
}

export interface CompanyRecord extends CompanyDirectoryRecord {
  full_json: JsonRecord;
  skill_levels: JsonRecord[];
  topicsBySkillId: Record<number, string[]>;
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
    const seedIds = new Set(SEED_COMPANIES.map((company) => company.company_id));
    const seedRecords: CompanyDirectoryRecord[] = SEED_COMPANIES.map((company) => ({
      company_id: company.company_id,
      short_json: withCompanyId(company.short_json, company.company_id),
      headquarters_address: asString(company.short_json.headquarters_address) || asString(asRecord(company.full_json).headquarters_address),
      logo_url: asString(asRecord(company.short_json).logo_url) || asString(asRecord(company.full_json).logo_url),
      website_url: asString(company.short_json.website_url) || asString(asRecord(company.full_json).website_url),
    }));

    const directoryRecords: CompanyDirectoryRecord[] = ALL_118_COMPANIES
      .filter((company) => !seedIds.has(company.company_id))
      .map((company) => ({
        company_id: company.company_id,
        short_json: withCompanyId({
          company_id: company.company_id,
          name: company.name,
          short_name: company.short_name,
          category: company.category || "Enterprise",
          headquarters_address: "India / Global",
          employee_size: "1,000+ employees",
          yoy_growth_rate: "N/A",
          website_url: "",
          data_status: "benchmark",
        }, company.company_id),
        headquarters_address: "India / Global",
        logo_url: "",
        website_url: "",
      }));

    return [...seedRecords, ...directoryRecords].sort((a, b) => a.company_id - b.company_id);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("company_json")
    .select("company_id, short_json, headquarters_address:full_json->>headquarters_address, logo_url:full_json->>logo_url, website_url:full_json->>website_url")
    .order("company_id", { ascending: true });
  throwIfError(error, "Could not load the company directory");

  return (data ?? []).map((row) => ({
    company_id: Number(row.company_id),
    short_json: withCompanyId(row.short_json, Number(row.company_id)),
    headquarters_address: asString(row.headquarters_address),
    logo_url: asString(row.logo_url),
    website_url: asString(row.website_url),
  }));
}

export async function fetchCompanyRecord(companyId: number): Promise<CompanyRecord | null> {
  if (!isSupabaseConfigured) {
    const seed = SEED_COMPANIES.find((company) => company.company_id === companyId);
    if (seed) {
      return {
        company_id: seed.company_id,
        short_json: withCompanyId(seed.short_json, seed.company_id),
        full_json: asRecord(seed.full_json),
        skill_levels: seed.skill_levels.map((skill) => asRecord(skill)),
        topicsBySkillId: {},
        skillDataWarnings: [],
      };
    }
    const directoryEntry = ALL_118_COMPANIES.find((company) => company.company_id === companyId);
    if (!directoryEntry) return null;
    const common = {
      company_id: directoryEntry.company_id,
      name: directoryEntry.name,
      short_name: directoryEntry.short_name,
      category: directoryEntry.category || "Enterprise",
      headquarters_address: "India / Global",
      employee_size: "1,000+ employees",
      yoy_growth_rate: "N/A",
      website_url: "",
      data_status: "benchmark",
    };
    return {
      company_id: directoryEntry.company_id,
      short_json: withCompanyId(common, directoryEntry.company_id),
      full_json: {
        ...common,
        overview_text: `${directoryEntry.name} profile from the RADIX 118 Company Placement Directory. Preparing for technical roles at ${directoryEntry.short_name} requires strong foundation across core computer science competencies.`,
        technology_stack: "Modern full-stack, distributed systems, cloud computing, and databases",
        ai_ml_adoption_level: "Enterprise applied AI / ML integration",
        tech_adoption_rating: "High",
        focus_sectors: directoryEntry.category || "Technology & Services",
        work_culture_summary: "Collaborative engineering environment with continuous learning and peer mentoring",
        learning_culture: "Structured onboarding, internal mobility, and technical skill development paths",
      },
      skill_levels: [
        { skill_set_id: 1, skill_set_name: "Data Structures & Algorithms", required_level: 7, required_proficiency: "Advanced" },
        { skill_set_id: 2, skill_set_name: "Object-Oriented Programming", required_level: 7, required_proficiency: "Advanced" },
        { skill_set_id: 3, skill_set_name: "SQL & Databases", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 4, skill_set_name: "Cloud Fundamentals (AWS/Azure)", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 5, skill_set_name: "Operating Systems", required_level: 5, required_proficiency: "Proficient" },
        { skill_set_id: 6, skill_set_name: "Computer Networks", required_level: 5, required_proficiency: "Proficient" },
        { skill_set_id: 7, skill_set_name: "Aptitude & Logical Reasoning", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 8, skill_set_name: "Communication & Behavioral", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 9, skill_set_name: "Web Development Basics", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 10, skill_set_name: "System Design (Intro)", required_level: 5, required_proficiency: "Proficient" },
        { skill_set_id: 11, skill_set_name: "Git & Version Control", required_level: 6, required_proficiency: "Proficient" },
        { skill_set_id: 12, skill_set_name: "Generative AI Basics", required_level: 4, required_proficiency: "Intermediate" },
      ],
      topicsBySkillId: {},
      skillDataWarnings: ["Company benchmark profile loaded from offline directory cache."],
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
  if (skillSetsResult.error) skillDataWarnings.push("Some skill names are not available yet.");
  if (proficienciesResult.error) skillDataWarnings.push("Some proficiency labels are not available yet.");

  const topicRowsResult = skillSetIds.length
    ? await client
        .from("skill_set_topics")
        .select("skill_set_id, level_number, topics")
        .in("skill_set_id", skillSetIds)
        .order("skill_set_id", { ascending: true })
        .order("level_number", { ascending: true })
    : { data: [], error: null };
  if (topicRowsResult.error) skillDataWarnings.push("Some learning roadmap details are not available yet.");

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
    skillDataWarnings,
  };
}
