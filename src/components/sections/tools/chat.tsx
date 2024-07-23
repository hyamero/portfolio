import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";

export function CardsChat() {
  const messages = [
    {
      role: "agent",
      content: "Hi, how can I help you today?",
    },
    {
      role: "user",
      content:
        "Can you create a technical overview about large language models?",
    },
  ];

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-neutral-400">
              <Icons.openai className="scale-75 opacity-85" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">GPT</p>
            <p className="text-sm text-muted-foreground">gpt-3.5-turbo</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-border bg-neutral-950 hover:bg-neutral-900"
        >
          <Moon className="absolute size-[1.2rem] text-neutral-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
