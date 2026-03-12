import type { Child } from "@/lib/parentvue/types";

export default function ChildLegend({
  childrenData,
}: {
  childrenData: Child[];
}) {
  if (childrenData.length <= 1) return null;

  return (
    <div className="hidden md:flex items-center gap-3">
      {childrenData.map((child) => (
        <div key={child.intID} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${child.color}`} />
          <span className="text-xs text-gray-500">{child.name}</span>
        </div>
      ))}
    </div>
  );
}
