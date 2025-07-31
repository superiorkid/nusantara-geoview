import { createFileRoute } from "@tanstack/react-router";
import MapBase from "../components/map-base";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <MapBase />;
}
