import { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type FieldError,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: "text" | "email" | "password" | "url" | "tel" | "number";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

interface SwitchFieldProps extends BaseFieldProps {
  type: "switch";
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

interface DateFieldProps extends BaseFieldProps {
  type: "date" | "datetime-local";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type FormFieldProps =
  | TextFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | SwitchFieldProps
  | DateFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, name, error, required, description, className } = props;

  const renderField = () => {
    switch (props.type) {
      case "text":
      case "email":
      case "password":
      case "url":
      case "tel":
      case "number":
        return (
          <Input
            id={name}
            name={name}
            type={props.type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            className={cn(error && "border-destructive")}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={name}
            name={name}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            disabled={props.disabled}
            className={cn(error && "border-destructive")}
          />
        );

      case "select":
        return (
          <Select
            value={props.value}
            onValueChange={props.onChange}
            disabled={props.disabled}
          >
            <SelectTrigger className={cn(error && "border-destructive")}>
              <SelectValue placeholder={props.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "switch":
        return (
          <div className="flex items-center gap-2">
            <Switch
              id={name}
              checked={props.value}
              onCheckedChange={props.onChange}
              disabled={props.disabled}
            />
            {description && (
              <span className="text-sm text-muted-foreground">{description}</span>
            )}
          </div>
        );

      case "date":
      case "datetime-local":
        return (
          <Input
            id={name}
            name={name}
            type={props.type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={props.disabled}
            className={cn(error && "border-destructive")}
          />
        );

      default:
        return null;
    }
  };

  const isSwitch = props.type === "switch";
  if (isSwitch) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <Label htmlFor={name} className="flex flex-col gap-1">
          <span>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </span>
        </Label>
        {renderField()}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {description && !isSwitch && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h4 className="text-sm font-medium">{title}</h4>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return <div className={cn("grid grid-cols-2 gap-4", className)}>{children}</div>;
}

// ============================================
// React Hook Form (RHF) integration
// ============================================

interface RHFFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "date" | "datetime-local" | "switch";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  rows?: number;
  className?: string;
}

/**
 * A form field component that integrates with react-hook-form's Controller pattern.
 * Use this alongside useZodForm() from "@/lib/form-utils" for type-safe,
 * schema-validated forms.
 *
 * For simple text/number/date inputs, prefer using register() directly
 * with the standard Input component. Use RHFFormField when you need
 * Select or Switch integration via Controller.
 */
export function RHFFormField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  options,
  required,
  disabled,
  description,
  rows,
  className,
}: RHFFormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const renderInput = () => {
          switch (type) {
            case "textarea":
              return (
                <Textarea
                  {...field}
                  id={name}
                  placeholder={placeholder}
                  rows={rows || 3}
                  disabled={disabled}
                  className={cn(error && "border-destructive")}
                />
              );

            case "select":
              return (
                <Select
                  value={field.value as string}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger className={cn(error && "border-destructive")}>
                    <SelectValue placeholder={placeholder || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case "switch":
              return (
                <div className="flex items-center gap-2">
                  <Switch
                    id={name}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                  {description && (
                    <span className="text-sm text-muted-foreground">{description}</span>
                  )}
                </div>
              );

            default:
              return (
                <Input
                  {...field}
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  value={field.value ?? ""}
                  className={cn(error && "border-destructive")}
                />
              );
          }
        };

        if (type === "switch") {
          return (
            <div className={cn("flex items-center justify-between", className)}>
              <Label htmlFor={name} className="flex flex-col gap-1">
                <span>
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </span>
              </Label>
              {renderInput()}
            </div>
          );
        }

        return (
          <div className={cn("space-y-2", className)}>
            <Label htmlFor={name}>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderInput()}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && <p className="text-xs text-destructive">{error.message}</p>}
          </div>
        );
      }}
    />
  );
}

/**
 * Inline error display helper for use with register().
 * Usage: <FieldError error={form.formState.errors.title} />
 */
export function FieldErrorMessage({ error }: { error?: FieldError }) {
  if (!error?.message) return null;
  return <p className="text-xs text-destructive">{error.message}</p>;
}
