"use client";

import themes from "@/lib/stats-themes.json";

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

import { Icons } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function GhStatsForm() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="space-y-10 pt-10 ">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="w-full scale-90 space-y-6"
        >
          <div className="flex items-end gap-2 text-neutral-400">
            <div className="w-full">
              <label>GitHub Username</label>
              <Input placeholder="hyamero" className="text-base" />
            </div>

            <div className="flex w-full flex-col">
              <label>Theme</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between text-muted-foreground"
                  >
                    Select theme
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command className="opacity-60">
                    <CommandInput placeholder="Search theme..." />
                    <CommandEmpty>No theme found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {themes.map((theme) => (
                          <CommandItem
                            value={theme.label}
                            key={theme.value}
                            className="cursor-pointer"
                          >
                            {theme.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-muted-foreground">
                  <Icons.adjust className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto px-7 opacity-60">
                <p className="mb-5 text-sm text-muted-foreground">
                  Update card preferences.
                </p>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <Switch id="hideBorder" />
                    </div>
                    <Label htmlFor="hideBorder" className="mb-1">
                      Hide Card Border
                    </Label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <Switch id="privCommits" />
                  </div>
                  <Label htmlFor="privCommits" className="mb-1">
                    Count Private Commits
                  </Label>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" className="w-full text-neutral-400">
            Generate Stats
          </Button>

          <ul className="flex w-full justify-between border-b border-neutral-700 [&>li]:w-full [&>li]:text-center">
            <li>
              <span>Stats</span>
            </li>
            <li>
              <span>Top Languages</span>
            </li>
            <li>
              <span>Streak</span>
            </li>
          </ul>
        </form>
      </CardContent>
    </Card>
  );
}
