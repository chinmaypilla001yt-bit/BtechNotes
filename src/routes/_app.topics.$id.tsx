import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/topics/$id")({
  component: () => null,
});
