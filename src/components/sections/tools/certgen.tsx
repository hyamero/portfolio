import Link from "next/link";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";

export function CertGen() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="flex flex-col items-center justify-center">
        <Link
          href="https://github.com/omsimos"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-full border border-white/5 bg-neutral-950 text-white transition-all ease-in"
        >
          <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out">
            <span>✨ Certificate of Recognition</span>
          </AnimatedShinyText>
        </Link>

        <div className="text-center text-neutral-600">
          <p className="text-2xl font-semibold">Developer of the Year</p>
          <p className="text-sm">is hereby presented to</p>
        </div>
      </CardHeader>
      <CardContent className="">
        <p className="border-b pb-2 text-center text-2xl font-semibold uppercase text-neutral-700">
          Joseph Dale Bañares
        </p>
      </CardContent>
    </Card>
  );
}
