"use client";

import * as React from "react";
import { Check, ChevronDown, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Language = {
  value: string;
  label: string;
  nativeName: string;
};

const languages: Language[] = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "th", label: "Thai", nativeName: "ไทย" },
];

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("en");

  const selectedLanguage = languages.find((language) => language.value === value);

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);
    // In a real implementation, this would update the application's language
    // and potentially reload translations
    document.documentElement.lang = currentValue;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select language"
            className="flex items-center justify-between w-[140px] gap-1 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Globe className="h-4 w-4 mr-1" aria-hidden="true" />
            <span>{selectedLanguage?.nativeName}</span>
            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search language..." 
              className="h-9"
              aria-label="Search for a language"
            />
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup heading="Languages" aria-label="Available languages">
              {languages.map((language) => (
                <CommandItem
                  key={language.value}
                  value={language.value}
                  onSelect={handleSelect}
                  aria-selected={value === language.value}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span>{language.nativeName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({language.label})
                    </span>
                  </div>
                  {value === language.value && (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
