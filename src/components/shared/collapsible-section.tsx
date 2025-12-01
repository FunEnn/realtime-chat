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
          className="w-full flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1.5 hover:bg-sidebar-accent rounded transition-colors"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground transition-transform duration-200 ${
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
          <div className="mt-1">{children}</div>
        </div>
      </div>
    );
  },
);

CollapsibleSection.displayName = "CollapsibleSection";
export default CollapsibleSection;
