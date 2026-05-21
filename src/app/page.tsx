import { AgentShell } from "@/components/AgentShell/AgentShell";
import { pickRandomStarterPrompts } from "@/components/AgentShell/starterPrompts";

import "./page.scss";

export const dynamic = "force-dynamic";

export default function Home() {
  return <AgentShell starterPrompts={pickRandomStarterPrompts(3)} />;
}
