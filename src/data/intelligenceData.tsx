import {
  Award,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Compass,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Laptop,
  Leaf,
  MapPin,
  Megaphone,
  Newspaper,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { JsonRecord } from "@/lib/companyData";

export interface IntelligenceField {
  key: string;
  label: string;
  value: unknown;
}

export interface IntelligenceSection {
  id: string;
  title: string;
  icon: LucideIcon;
  fields: IntelligenceField[];
}

const schema: Array<{ title: string; icon: LucideIcon; fields: Array<[string, string]> }> = [
  { title: "Company Identity", icon: Building2, fields: [["name", "Company name"], ["short_name", "Short name"], ["category", "Category"], ["incorporation_year", "Year of incorporation"], ["nature_of_company", "Nature of company"], ["headquarters_address", "Headquarters"]] },
  { title: "Overview & Vision", icon: Compass, fields: [["overview_text", "Company overview"], ["vision_statement", "Vision"], ["mission_statement", "Mission"], ["history_timeline", "History & milestones"]] },
  { title: "Leadership", icon: Users, fields: [["ceo_name", "CEO"], ["key_leaders", "Key leaders"], ["board_members", "Board members"], ["ceo_linkedin_url", "CEO LinkedIn"], ["warm_intro_pathways", "Warm introduction pathways"], ["decision_maker_access", "Decision-maker access"]] },
  { title: "Funding & Financials", icon: Landmark, fields: [["annual_revenue", "Annual revenue"], ["annual_profit", "Annual profit"], ["revenue_mix", "Revenue mix"], ["valuation", "Valuation"], ["yoy_growth_rate", "Year-over-year growth"], ["profitability_status", "Profitability"], ["key_investors", "Key investors"], ["recent_funding_rounds", "Funding activity"], ["total_capital_raised", "Capital raised"], ["burn_rate", "Burn rate"], ["runway_months", "Runway"], ["burn_multiplier", "Burn multiple"]] },
  { title: "Global Presence", icon: Globe2, fields: [["operating_countries", "Operating countries"], ["office_count", "Office count"], ["office_locations", "Office locations"], ["employee_size", "Employee size"]] },
  { title: "Products & Services", icon: PackageCheck, fields: [["offerings_description", "Offerings"], ["focus_sectors", "Focus sectors"], ["pain_points_addressed", "Customer problems addressed"], ["top_customers", "Customer segments"], ["customer_testimonials", "Customer stories"]] },
  { title: "Technology Stack", icon: Laptop, fields: [["tech_stack", "Technology stack"], ["ai_ml_adoption_level", "AI and ML adoption"], ["tech_adoption_rating", "Technology adoption"], ["r_and_d_investment", "R&D investment"], ["intellectual_property", "Intellectual property"], ["cybersecurity_posture", "Cybersecurity posture"]] },
  { title: "Partnerships & Ecosystem", icon: HeartHandshake, fields: [["technology_partners", "Technology partners"], ["partnership_ecosystem", "Partnership ecosystem"], ["industry_associations", "Industry associations"], ["go_to_market_strategy", "Go-to-market strategy"]] },
  { title: "Competitive Landscape", icon: ChartNoAxesCombined, fields: [["key_competitors", "Key competitors"], ["competitive_advantages", "Competitive advantages"], ["unique_differentiators", "Unique differentiators"], ["weaknesses_gaps", "Gaps and limitations"], ["benchmark_vs_peers", "Peer benchmark"], ["market_share_percentage", "Market share"]] },
  { title: "Market Opportunity", icon: Sparkles, fields: [["tam", "Total addressable market"], ["sam", "Serviceable addressable market"], ["som", "Serviceable obtainable market"], ["future_projections", "Future projections"], ["strategic_priorities", "Strategic priorities"]] },
  { title: "Core Value Proposition & ESG", icon: Leaf, fields: [["core_value_proposition", "Core value proposition"], ["core_values", "Core values"], ["esg_ratings", "ESG ratings"], ["carbon_footprint", "Carbon footprint"], ["ethical_sourcing", "Ethical sourcing"], ["sustainability_csr", "Sustainability & CSR"]] },
  { title: "Culture & Work Life", icon: HeartPulse, fields: [["work_culture_summary", "Work culture"], ["employee_turnover", "Employee turnover"], ["avg_retention_tenure", "Average tenure"], ["manager_quality", "Manager quality"], ["psychological_safety", "Psychological safety"], ["feedback_culture", "Feedback culture"], ["diversity_metrics", "Diversity metrics"], ["ethical_standards", "Ethical standards"], ["burnout_risk", "Burnout risk"]] },
  { title: "Recent News & Milestones", icon: Newspaper, fields: [["recent_news", "Recent news"], ["history_timeline", "Company milestones"], ["product_pipeline", "Product pipeline"], ["innovation_roadmap", "Innovation roadmap"]] },
  { title: "Sales & Customer Metrics", icon: BriefcaseBusiness, fields: [["sales_motion", "Sales motion"], ["customer_concentration_risk", "Customer concentration risk"], ["customer_acquisition_cost", "Customer acquisition cost"], ["customer_lifetime_value", "Customer lifetime value"], ["cac_ltv_ratio", "Acquisition cost to lifetime value"], ["churn_rate", "Churn rate"], ["net_promoter_score", "Net promoter score"]] },
  { title: "Risk & Compliance", icon: ShieldCheck, fields: [["regulatory_status", "Regulatory status"], ["legal_issues", "Legal issues"], ["supply_chain_dependencies", "Supply chain dependencies"], ["geopolitical_risks", "Geopolitical risks"], ["macro_risks", "Macroeconomic risks"]] },
  { title: "Work Location & Commute", icon: MapPin, fields: [["remote_policy_details", "Remote work policy"], ["location_centrality", "Location centrality"], ["public_transport_access", "Public transport"], ["cab_policy", "Company transport"], ["airport_commute_time", "Airport commute"], ["office_zone_type", "Office zone"]] },
  { title: "Safety & Wellbeing", icon: ShieldCheck, fields: [["area_safety", "Area safety"], ["safety_policies", "Safety policies"], ["infrastructure_safety", "Infrastructure safety"], ["emergency_preparedness", "Emergency preparedness"], ["health_support", "Health support"]] },
  { title: "Career Growth & Learning", icon: Sparkles, fields: [["training_spend", "Training investment"], ["onboarding_quality", "Onboarding"], ["learning_culture", "Learning culture"], ["exposure_quality", "Project exposure"], ["mentorship_availability", "Mentorship"], ["internal_mobility", "Internal mobility"], ["promotion_clarity", "Promotion clarity"], ["tools_access", "Tools access"], ["role_clarity", "Role clarity"], ["early_ownership", "Early ownership"], ["work_impact", "Work impact"], ["execution_thinking_balance", "Execution and strategy balance"], ["automation_level", "Automation exposure"], ["cross_functional_exposure", "Cross-functional exposure"]] },
  { title: "Brand & Reputation", icon: Award, fields: [["brand_value", "Brand value"], ["brand_sentiment_score", "Brand sentiment"], ["awards_recognitions", "Awards and recognition"], ["event_participation", "Events and industry presence"]] },
  { title: "Compensation & Benefits", icon: Star, fields: [["fixed_vs_variable_pay", "Fixed and variable pay"], ["bonus_predictability", "Bonus predictability"], ["esops_incentives", "Equity incentives"], ["family_health_insurance", "Family health insurance"], ["relocation_support", "Relocation support"], ["lifestyle_benefits", "Lifestyle benefits"], ["leave_policy", "Leave policy"]] },
  { title: "Digital Presence & Ratings", icon: Megaphone, fields: [["website_url", "Website"], ["linkedin_url", "LinkedIn"], ["twitter_handle", "X / Twitter"], ["facebook_url", "Facebook"], ["instagram_url", "Instagram"], ["website_quality", "Website quality"], ["website_rating", "Website rating"], ["website_traffic_rank", "Website traffic rank"], ["social_media_followers", "Social followers"], ["glassdoor_rating", "Glassdoor rating"], ["indeed_rating", "Indeed rating"], ["google_rating", "Google rating"]] },
];

export function buildIntelligenceSections(profile?: JsonRecord): IntelligenceSection[] {
  const record = profile ?? {};
  return schema.map((section, index) => ({
    id: `section-${index + 1}`,
    title: section.title,
    icon: section.icon,
    fields: section.fields.map(([key, label]) => ({ key, label, value: record[key] })),
  }));
}
