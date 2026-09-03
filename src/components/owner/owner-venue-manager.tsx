"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  HiArrowRight,
  HiBuildingOffice2,
  HiCalendarDays,
  HiMapPin,
  HiPencilSquare,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

import { OwnerStatusBadge } from "@/components/owner/owner-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DialogDrawer } from "@/components/ui/dialog-drawer";
import { Input } from "@/components/ui/input";
import type { OwnerVenueSummary } from "@/lib/owner/server";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TricityCity } from "@/types/database";

const cities: TricityCity[] = ["Chandigarh", "Mohali", "Panchkula"];

type VenueDraft = {
  name: string;
  city: TricityCity;
  area: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string;
  amenities: string;
  imageUrl: string;
  imageAlt: string;
};

const emptyDraft: VenueDraft = {
  name: "",
  city: "Chandigarh",
  area: "",
  address: "",
  latitude: "30.7333",
  longitude: "76.7794",
  description: "",
  amenities: "Floodlights, Drinking water, Parking",
  imageUrl: "/assets/venues/floodlit-multisport-turf.jpg",
  imageAlt: "Floodlit fictional sports venue",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function amenitiesFrom(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function draftForVenue(venue: OwnerVenueSummary): VenueDraft {
  return {
    name: venue.name,
    city: venue.city,
    area: venue.area,
    address: venue.address,
    latitude: String(venue.latitude),
    longitude: String(venue.longitude),
    description: venue.description,
    amenities: venue.amenities.join(", "),
    imageUrl:
      venue.primaryImage?.public_url ??
      "/assets/venues/floodlit-multisport-turf.jpg",
    imageAlt: venue.primaryImage?.alt_text ?? `${venue.name} sports venue`,
  };
}

function VenueForm({
  value,
  onChange,
  onSubmit,
  busy,
  submitLabel,
  message,
}: {
  value: VenueDraft;
  onChange: (next: VenueDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  submitLabel: string;
  message: string;
}) {
  function field<K extends keyof VenueDraft>(key: K, nextValue: VenueDraft[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Venue name
        <Input
          value={value.name}
          minLength={3}
          maxLength={120}
          onChange={(event) => field("name", event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          City
          <select
            value={value.city}
            onChange={(event) =>
              field("city", event.target.value as TricityCity)
            }
            disabled={busy}
            className="focus-ring h-12 rounded-xl border border-input bg-card px-4 text-sm text-foreground"
          >
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Area
          <Input
            value={value.area}
            minLength={2}
            maxLength={100}
            onChange={(event) => field("area", event.target.value)}
            disabled={busy}
            required
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Full address
        <Input
          value={value.address}
          minLength={5}
          maxLength={240}
          onChange={(event) => field("address", event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Latitude
          <Input
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={value.latitude}
            onChange={(event) => field("latitude", event.target.value)}
            disabled={busy}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Longitude
          <Input
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={value.longitude}
            onChange={(event) => field("longitude", event.target.value)}
            disabled={busy}
            required
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          value={value.description}
          minLength={20}
          maxLength={1200}
          onChange={(event) => field("description", event.target.value)}
          disabled={busy}
          required
          rows={4}
          className="focus-ring w-full rounded-xl border border-input bg-card px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Amenities
        <Input
          value={value.amenities}
          onChange={(event) => field("amenities", event.target.value)}
          disabled={busy}
          placeholder="Floodlights, Parking, Drinking water"
        />
        <span className="text-xs font-normal text-muted-foreground">
          Separate amenities with commas.
        </span>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Primary image URL
        <Input
          value={value.imageUrl}
          onChange={(event) => field("imageUrl", event.target.value)}
          disabled={busy}
          placeholder="/assets/venues/example.jpg or https://…"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Image description
        <Input
          value={value.imageAlt}
          minLength={5}
          maxLength={180}
          onChange={(event) => field("imageAlt", event.target.value)}
          disabled={busy}
          required
        />
      </label>

      {message ? (
        <p className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

export function OwnerVenueManager({
  ownerUserId,
  venues,
}: {
  ownerUserId: string;
  venues: OwnerVenueSummary[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerVenueSummary | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const totals = useMemo(
    () => ({
      courts: venues.reduce((total, venue) => total + venue.courtCount, 0),
      live: venues.filter(
        (venue) =>
          venue.status === "active" &&
          venue.approval?.decision === "approved",
      ).length,
    }),
    [venues],
  );

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setMessage("");
    setCreateOpen(true);
  }

  function openEdit(venue: OwnerVenueSummary) {
    setCreateOpen(false);
    setEditing(venue);
    setDraft(draftForVenue(venue));
    setMessage("");
  }

  function validateDraft() {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return "Enter valid latitude and longitude values.";
    }
    if (
      !draft.imageUrl.startsWith("/") &&
      !draft.imageUrl.startsWith("https://")
    ) {
      return "Use a same-site image path or a secure HTTPS image URL.";
    }
    return null;
  }

  async function createVenue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateDraft();
    if (validation) {
      setMessage(validation);
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const venueId = crypto.randomUUID();
    const venueSlug = `${slugify(draft.name) || "venue"}-${venueId.slice(0, 8)}`;
    const { error: venueError } = await supabase.from("venues").insert({
      id: venueId,
      owner_user_id: ownerUserId,
      slug: venueSlug,
      name: draft.name.trim(),
      city: draft.city,
      area: draft.area.trim(),
      address: draft.address.trim(),
      latitude: Number(draft.latitude),
      longitude: Number(draft.longitude),
      description: draft.description.trim(),
      amenities: amenitiesFrom(draft.amenities),
    });

    if (venueError) {
      setBusy(false);
      setMessage(venueError.message);
      return;
    }

    const { error: imageError } = await supabase.from("venue_images").insert({
      id: crypto.randomUUID(),
      venue_id: venueId,
      public_url: draft.imageUrl.trim(),
      alt_text: draft.imageAlt.trim(),
      is_primary: true,
    });

    if (imageError) {
      await supabase.from("venues").delete().eq("id", venueId);
      setBusy(false);
      setMessage(imageError.message);
      return;
    }

    setBusy(false);
    setCreateOpen(false);
    setDraft(emptyDraft);
    router.refresh();
  }

  async function updateVenue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const validation = validateDraft();
    if (validation) {
      setMessage(validation);
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error: venueError } = await supabase
      .from("venues")
      .update({
        name: draft.name.trim(),
        city: draft.city,
        area: draft.area.trim(),
        address: draft.address.trim(),
        latitude: Number(draft.latitude),
        longitude: Number(draft.longitude),
        description: draft.description.trim(),
        amenities: amenitiesFrom(draft.amenities),
      })
      .eq("id", editing.id);

    if (venueError) {
      setBusy(false);
      setMessage(venueError.message);
      return;
    }

    const imageMutation = editing.primaryImage
      ? supabase
          .from("venue_images")
          .update({
            public_url: draft.imageUrl.trim(),
            alt_text: draft.imageAlt.trim(),
          })
          .eq("id", editing.primaryImage.id)
      : supabase.from("venue_images").insert({
          id: crypto.randomUUID(),
          venue_id: editing.id,
          public_url: draft.imageUrl.trim(),
          alt_text: draft.imageAlt.trim(),
          is_primary: true,
        });
    const { error: imageError } = await imageMutation;

    setBusy(false);
    if (imageError) {
      setMessage(imageError.message);
      return;
    }

    setEditing(null);
    router.refresh();
  }

  async function deleteDraftVenue(venue: OwnerVenueSummary) {
    if (
      !window.confirm(
        `Delete the draft “${venue.name}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(true);
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.from("venues").delete().eq("id", venue.id);
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-2xl font-bold">{venues.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Owned venues</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold">{totals.courts}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Courts, turfs and grounds
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-primary">{totals.live}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Approved and visible
          </p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your venues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create drafts, complete court setup, then submit for admin review.
          </p>
        </div>
        <Button onClick={openCreate}>
          <HiPlus className="size-4" />
          New venue
        </Button>
      </div>

      {message && !createOpen && !editing ? (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      {venues.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {venues.map((venue) => (
            <Card key={venue.id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <HiBuildingOffice2 className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{venue.name}</h3>
                      <OwnerStatusBadge
                        status={venue.status}
                        decision={venue.approval?.decision}
                      />
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <HiMapPin className="size-4 text-primary" />
                      {venue.area}, {venue.city}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="neutral">
                        {venue.courtCount} {venue.courtCount === 1 ? "court" : "courts"}
                      </Badge>
                      <Badge variant="neutral">
                        {venue.sportCount} {venue.sportCount === 1 ? "sport" : "sports"}
                      </Badge>
                      <Badge variant="neutral">
                        {venue.availableSlotCount} open slots
                      </Badge>
                      {venue.blockedSlotCount > 0 ? (
                        <Badge variant="warning">
                          {venue.blockedSlotCount} blocked
                        </Badge>
                      ) : null}
                    </div>
                    {venue.approval?.decision === "rejected" &&
                    venue.approval.review_note ? (
                      <p className="mt-3 text-xs leading-5 text-red-700">
                        Review note: {venue.approval.review_note}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(venue)}
                  >
                    <HiPencilSquare className="size-4" />
                    Edit
                  </Button>
                  {venue.status === "draft" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDraftVenue(venue)}
                      disabled={busy}
                    >
                      <HiTrash className="size-4" />
                      Delete
                    </Button>
                  ) : null}
                  <Link
                    href={`/app/owner/venues/${venue.id}/slots`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    <HiCalendarDays className="size-4" />
                    Manage operations
                    <HiArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-4 flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <HiBuildingOffice2 className="size-9 text-primary" />
          <h3 className="mt-4 font-semibold">Create your first venue</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Start with the venue profile and primary image. Courts and weekly
            availability are configured after creation.
          </p>
          <Button className="mt-5" onClick={openCreate}>
            <HiPlus className="size-4" />
            New venue
          </Button>
        </Card>
      )}

      <DialogDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create venue draft"
        description="The venue stays private until its courts are configured and admin review is complete."
        className="max-h-[88dvh] overflow-y-auto"
      >
        <VenueForm
          value={draft}
          onChange={setDraft}
          onSubmit={createVenue}
          busy={busy}
          submitLabel="Create venue"
          message={message}
        />
      </DialogDrawer>

      <DialogDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={`Edit ${editing?.name ?? "venue"}`}
        description="Material changes to a live venue return it to pending review."
        className="max-h-[88dvh] overflow-y-auto"
      >
        <VenueForm
          value={draft}
          onChange={setDraft}
          onSubmit={updateVenue}
          busy={busy}
          submitLabel="Save venue changes"
          message={message}
        />
      </DialogDrawer>
    </>
  );
}
