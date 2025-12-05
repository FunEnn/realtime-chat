import { ChevronRight } from "lucide-react";
import { memo, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const CollapsibleSection = memo(
  ({
    title,
    count,
    isExpanded,
    onToggle,
    children,
  }: CollapsibleSectionProps) => {
    return (
      <div>
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-2 md:gap-2.5 px-2 md:px-2.5 py-2 hover:bg-sidebar-accent rounded-lg transition-all duration-200 hover:shadow-sm"
        >
          <ChevronRight
            className={`w-4 h-4 md:w-4 md:h-4 text-muted-foreground transition-transform duration-300 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <h3 className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title} {count !== undefined && `(${count})`}
          </h3>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    );
  },
);

CollapsibleSection.displayName = "CollapsibleSection";
export default CollapsibleSection;
