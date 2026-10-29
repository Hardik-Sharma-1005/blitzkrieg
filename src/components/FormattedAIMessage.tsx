import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part.replace(/\*\*/g, "")}</span>,
  );
}

export function FormattedAIMessage({ text }: { text: string }) {
  const readableText = text
    .replace(/\r/g, "")
    .replace(/(?<=[.!?])\s+(?=(?:Next|Then|Finally|Also|After that|From there)\b)/g, "\n\n")
    .trim();
  const blocks = readableText.split(/\n\s*\n/).filter(Boolean);

  return <div className="space-y-3 leading-6">
    {blocks.map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const heading = lines.length === 1 ? lines[0].match(/^#{1,3}\s+(.+)$/) : null;
      if (heading) return <h5 key={index} className="font-semibold">{renderInline(heading[1])}</h5>;

      const unordered = lines.map((line) => line.match(/^[-*]\s+(.+)$/));
      if (unordered.every(Boolean)) return <ul key={index} className="list-disc space-y-1 pl-5">{unordered.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item![1])}</li>)}</ul>;

      const ordered = lines.map((line) => line.match(/^\d+[.)]\s+(.+)$/));
      if (ordered.every(Boolean)) return <ol key={index} className="list-decimal space-y-1 pl-5">{ordered.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item![1])}</li>)}</ol>;

      return <p key={index}>{renderInline(lines.map((line) => line.replace(/^#{1,3}\s+/, "")).join(" "))}</p>;
    })}
  </div>;
}
