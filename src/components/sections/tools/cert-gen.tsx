import Link from "next/link";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";

export function CertGen() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="flex flex-col items-center justify-center">
        <AnimatedShinyText className="group inline-flex items-center justify-center rounded-full border border-white/5 bg-neutral-950 px-4 py-1 text-xs font-medium text-white transition ease-out">
          <span>✨ Certificate of Recognition</span>
        </AnimatedShinyText>

        <div className="text-center text-neutral-600">
          <p className="text-nowrap text-xl font-semibold sm:text-2xl">
            Developer of the Year
          </p>
          <p className="text-sm">is hereby presented to</p>
        </div>
      </CardHeader>
      <CardContent className="">
        <p className="border-b pb-2 text-center text-xl font-semibold uppercase text-neutral-800 sm:text-2xl">
          Joseph Dale Bañares
        </p>
      </CardContent>
    </Card>
  );
}
