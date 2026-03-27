import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldWithHelp } from "./field-with-help";
import type { ArcherFieldGroupProps } from "@/lib/archer/types";

/**
 * ArcherFieldGroup - Grid layout for label/value field pairs.
 *
 * Displays fields in a responsive grid with support for 1 or 2 columns,
 * help tooltips, loading states, and field spanning.
 */
export function ArcherFieldGroup({
  fields,
  columns = 2,
  className,
}: ArcherFieldGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {fields.map((field, index) => {
        const isFullWidth = field.span === 2 && columns === 2;

        const fieldContent = (
          <div
            key={index}
            className={cn(
              "flex flex-col gap-1.5",
              isFullWidth && "md:col-span-2"
            )}
          >
            <div className="text-sm font-medium text-muted-foreground">
              {field.label}
            </div>
            <div className="text-sm">
              {field.loading ? (
                <Skeleton className="h-5 w-full" />
              ) : (
                field.value || (
                  <span className="text-muted-foreground">—</span>
                )
              )}
            </div>
          </div>
        );

        // If field has help text, wrap with FieldWithHelp
        if (field.help) {
          return (
            <div
              key={index}
              className={cn(isFullWidth && "md:col-span-2")}
            >
              <FieldWithHelp label={field.label} help={field.help}>
                <div className="text-sm">
                  {field.loading ? (
                    <Skeleton className="h-5 w-full" />
                  ) : (
                    field.value || (
                      <span className="text-muted-foreground">—</span>
                    )
                  )}
                </div>
              </FieldWithHelp>
            </div>
          );
        }

        return fieldContent;
      })}
    </div>
  );
}
