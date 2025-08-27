
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarDateRangePickerProps {
  onDateChange: (dates: Date[] | undefined) => void;
  className?: string;
}

export function CalendarDateRangePicker({ onDateChange, className }: CalendarDateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<Date[]>([new Date(), new Date()]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      onDateChange(dates);
    }
  };

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange && dateRange.length === 2 ? (
              <>
                {format(dateRange[0], "PPP", { locale: fr })} -{" "}
                {format(dateRange[1], "PPP", { locale: fr })}
              </>
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.[0]}
            selected={{ from: dateRange?.[0], to: dateRange?.[1] }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                handleDateSelect([range.from, range.to]);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
