import { OpponentFinder } from "@/components/matchmaking/opponent-finder";
import { PageShell } from "@/components/layout/page-shell";
import { requireAccountType } from "@/lib/auth/server";
import { getPlayerMatchmakingFeed } from "@/lib/matchmaking/server";

export default async function PlayerOpponentsPage() {
  const profile = await requireAccountType("player");
  const posts = await getPlayerMatchmakingFeed();

  return (
    <PageShell
      eyebrow="Opponents"
      title="Find teams to play"
      description="Join open matches from teams with confirmed slots, or publish your own booking when your team needs challengers."
    >
      <OpponentFinder posts={posts} currentUserId={profile.id} />
    </PageShell>
  );
}
