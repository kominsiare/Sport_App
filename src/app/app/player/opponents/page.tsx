import { OpponentFinder } from "@/components/matchmaking/opponent-finder";
import { PageShell } from "@/components/layout/page-shell";
import { requireAccountType } from "@/lib/auth/server";
import { getPlayerBookingData } from "@/lib/bookings/server";
import { getPlayerMatchmakingPageData } from "@/lib/matchmaking/server";

export default async function PlayerOpponentsPage() {
  const profile = await requireAccountType("player");
  const [
    { posts, availableSlotCount, currentTime },
    { bookings, matchmakingPosts },
  ] = await Promise.all([
    getPlayerMatchmakingPageData(),
    getPlayerBookingData(),
  ]);

  return (
    <PageShell
      eyebrow="Opponents"
      title="Find teams to play"
      description="Host an opponent search from a confirmed team booking, join another team’s open match, and share the same court slot."
    >
      <OpponentFinder
        posts={posts}
        currentUserId={profile.id}
        bookings={bookings}
        bookingPosts={matchmakingPosts}
        canBook={profile.can_book}
        availableSlotCount={availableSlotCount}
        currentTime={currentTime}
      />
    </PageShell>
  );
}
