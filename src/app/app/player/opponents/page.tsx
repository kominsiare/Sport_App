import { OpponentFinder } from "@/components/matchmaking/opponent-finder";
import { PageShell } from "@/components/layout/page-shell";
import { requireAccountType } from "@/lib/auth/server";
import { getPlayerMatchmakingFeed } from "@/lib/matchmaking/server";

export default async function PlayerOpponentsPage() {
  const profile = await requireAccountType("player");
  const posts = await getPlayerMatchmakingFeed();

  return (
    <PageShell
      eyebrow="Player · Opponents"
      title="Find teams to play against"
      description="Join open opponent searches from teams who already booked a slot, or publish your own confirmed booking when your team needs challengers."
    >
      <OpponentFinder posts={posts} currentUserId={profile.id} />
    </PageShell>
  );
}
