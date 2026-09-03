import { router } from "expo-router";

import { Button, EmptyState, Screen } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <Screen>
      <EmptyState
        action={<Button compact label="Back to Pllayz" onPress={() => router.replace("/")} />}
        icon="map-marker-question-outline"
        message="The screen you opened is unavailable."
        title="Nothing here"
      />
    </Screen>
  );
}
