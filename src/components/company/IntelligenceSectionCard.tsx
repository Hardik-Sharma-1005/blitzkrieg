import type { IntelligenceSection } from "@/data/intelligenceData";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FieldRow } from "@/components/company/FieldRow";

export function IntelligenceSectionCard({
  section,
  sectionRef,
}: {
  section: IntelligenceSection;
  sectionRef: (element: HTMLElement | null) => void;
}) {
  const Icon = section.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.35 }}>
    <Card id={section.id} ref={sectionRef} className="scroll-mt-36 border-[#e9e1d5] bg-[#fffdf8] shadow-[0_8px_24px_rgba(69,54,28,0.035)]">
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e4f2e9] text-[#246b5d]"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold text-slate-900">{section.title}</h2>
        </div>
        <span className="rounded-full bg-[#f3eee4] px-2.5 py-1 text-xs font-medium text-slate-500">{section.fields.length} fields</span>
      </div>
      <CardContent className="pt-3">
        <dl>
          {section.fields.map((field) => <FieldRow key={field.key} label={field.label} value={field.value} />)}
        </dl>
      </CardContent>
    </Card>
    </motion.div>
  );
}
