"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/status-page";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusPage title="Oh no, something went wrong..." />;
}
