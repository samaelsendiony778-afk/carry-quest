import { createFileRoute } from "@tanstack/react-router";
import { CarryQuest } from "@/components/carry-quest";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CarryQuest />;
}
