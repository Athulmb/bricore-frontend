"use strict"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "./utils"
import { Button } from "./button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"

interface ComboboxProps {
    options: { label: string; value: string }[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyText?: string
    allowCustom?: boolean
    onCustomAdd?: (value: string) => void
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    emptyText = "No option found.",
    allowCustom = false,
    onCustomAdd,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? options.find((option) => option.value === value)?.label || value
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 p-4">
                                <p className="text-sm text-gray-500">{emptyText}</p>
                                {allowCustom && inputValue && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                            onCustomAdd?.(inputValue)
                                            setOpen(false)
                                        }}
                                    >
                                        <Plus className="mr-2 h-3 w-3" />
                                        Add "{inputValue}"
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
