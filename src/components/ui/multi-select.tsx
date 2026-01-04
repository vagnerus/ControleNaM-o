
"use client"

import * as React from "react"
import { X } from "lucide-react"

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"

export interface Option {
  value: string
  label: string
  disable?: boolean
  /** fixed option that can't be removed. */
  fixed?: boolean
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined
}
interface GroupOption {
  [key: string]: Option[]
}

interface MultiSelectProps {
  options: Option[]
  selected: Option[]
  onChange: React.Dispatch<React.SetStateAction<Option[]>>
  placeholder?: string
  asChild?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  asChild = false,
  className,
  ...props
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  // OPEN POPUP ON ESC KEY
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleUnselect = (item: Option) => {
    onChange(selected.filter((s) => s.value !== item.value))
  }

  const handleSelect = (item: Option) => {
    onChange([...selected, item])
  }

  const selectables = options.filter(
    (option) => !selected.find((s) => s.value === option.value)
  )

  /**
   * Toggles the selection of an item.
   * If the item is already selected, it removes it from the selection.
   * If the item is not selected, it adds it to the selection.
   *
   * @param item - The item to toggle.
   */
  const toggle = (item: Option) => {
    const isSelected = selected.some((s) => s.value === item.value)
    if (isSelected) {
      handleUnselect(item)
    } else {
      handleSelect(item)
    }
  }

  const sortedOptions = React.useMemo(() => {
    let copy = [...options]
    copy.sort((a, b) => {
      // give priority to fixed options
      if (a.fixed && !b.fixed) {
        return -1
      }
      if (!a.fixed && b.fixed) {
        return 1
      }
      return a.label.localeCompare(b.label)
    })
    return copy
  }, [options])

  const groupedOptions = sortedOptions.reduce((acc, option) => {
    const key = String(option.group || "")
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(option)
    return acc
  }, {} as GroupOption)

  return (
    <Command
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setIsOpen(true)
        }
      }}
      className="overflow-visible bg-transparent"
    >
      <div
        className={cn(
          `group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`,
          className
        )}
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => {
            return (
              <Badge
                key={option.value}
                className={cn(
                  "flex items-center gap-1 rounded-sm",
                  option.fixed
                    ? "bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
                    : ""
                )}
              >
                {option.label}
                <button
                  className={cn(
                    "ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    option.fixed ? "hidden" : ""
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(option)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            onBlur={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {isOpen && selectables.length > 0 && (
          <div className="absolute top-0 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList className="h-full max-h-52 overflow-y-auto">
              {query.length > 0 && (
                <CommandPrimitive.Empty className="px-2 py-3 text-center text-sm">
                  No results found.
                </CommandPrimitive.Empty>
              )}
              {Object.entries(groupedOptions).map(([group, options]) => (
                <CommandGroup key={group} heading={group} className="text-xs">
                  {options
                    .filter(
                      (option) =>
                        !selected.find((s) => s.value === option.value)
                    )
                    .map((option) => (
                      <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onSelect={() => {
                          toggle(option)
                          setIsOpen(true)
                          setQuery("")
                          inputRef.current?.focus()
                        }}
                        className="cursor-pointer"
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  )
}
