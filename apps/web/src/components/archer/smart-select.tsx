import { useState } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from "lucide-react";
import type { SmartSelectProps } from "@/lib/archer/types";

/**
 * SmartSelect - Automatically chooses the appropriate control type.
 *
 * Based on the number of options:
 * - 2-4 options: RadioGroup (all options visible)
 * - 5-10 options: Select dropdown
 * - 10+ options: Combobox with search
 */
export function SmartSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  name,
}: SmartSelectProps) {
  const optionCount = options.length;

  // RadioGroup for 2-4 options
  if (optionCount >= 2 && optionCount <= 4) {
    return (
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={cn("space-y-2", className)}
        name={name}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <RadioGroupItem
              value={option.value}
              id={`${name || "smart-select"}-${option.value}`}
              disabled={option.disabled || disabled}
            />
            <Label
              htmlFor={`${name || "smart-select"}-${option.value}`}
              className={cn(
                "cursor-pointer font-normal",
                option.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="block text-sm text-muted-foreground">
                  {option.description}
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // Select dropdown for 5-10 options
  if (optionCount >= 5 && optionCount <= 10) {
    return (
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Combobox for 10+ options (or 0-1 options as fallback)
  return <SmartSelectCombobox {...{ options, value, onChange, placeholder, disabled, className, name }} />;
}

/**
 * Combobox variant of SmartSelect for large option lists.
 */
function SmartSelectCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
