"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  HiArrowLeft,
  HiArrowPath,
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiCurrencyRupee,
  HiPencilSquare,
  HiPlus,
  HiShieldCheck,
} from "react-icons/hi2";

import { OwnerStatusBadge } from "@/components/owner/owner-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogDrawer } from "@/components/ui/dialog-drawer";
import { Input } from "@/components/ui/input";
import type {
  OwnerCourtOperations,
  OwnerVenueOperations,
} from "@/lib/owner/server";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  Sport,
  VenueSlot,
  WeeklyAvailabilityRule,
} from "@/types/database";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const slotDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

type CourtDraft = {
  name: string;
  courtType: string;
  durationMinutes: string;
  basePrice: string;
  sportIds: string[];
};

type RuleDraft = {
  courtId: string;
  sportId: string;
  weekday: string;
  startLocal: string;
  endLocal: string;
  durationMinutes: string;
  priceTotal: string;
};

const emptyCourtDraft: CourtDraft = {
  name: "",
  courtType: "",
  durationMinutes: "60",
  basePrice: "1000",
  sportIds: [],
};

function ruleDraftForCourt(
  court: OwnerCourtOperations,
  sport?: Sport,
): RuleDraft {
  const activeSport =
    sport ?? court.sports.find((row) => row.is_active)?.sport;
  return {
    courtId: court.id,
    sportId: activeSport?.id ?? "",
    weekday: String(new Date().getDay()),
    startLocal: "18:00",
    endLocal: "22:00",
    durationMinutes: String(
      court.sports.find((row) => row.sport_id === activeSport?.id)
        ?.duration_minutes ??
        court.default_duration_minutes ??
        activeSport?.default_duration_minutes ??
        60,
    ),
    priceTotal: String(court.base_price),
  };
}

function ruleDraftForExisting(rule: WeeklyAvailabilityRule): RuleDraft {
  return {
    courtId: rule.court_id,
    sportId: rule.sport_id,
    weekday: String(rule.weekday),
    startLocal: rule.start_local.slice(0, 5),
    endLocal: rule.end_local.slice(0, 5),
    durationMinutes: String(rule.duration_minutes),
    priceTotal: String(rule.price_total),
  };
}

function CourtForm({
  value,
  sports,
  onChange,
  onSubmit,
  busy,
  message,
  submitLabel,
}: {
  value: CourtDraft;
  sports: Sport[];
  onChange: (next: CourtDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  message: string;
  submitLabel: string;
}) {
  function toggleSport(sportId: string) {
    onChange({
      ...value,
      sportIds: value.sportIds.includes(sportId)
        ? value.sportIds.filter((id) => id !== sportId)
        : [...value.sportIds, sportId],
    });
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Court, turf or ground name
        <Input
          value={value.name}
          minLength={2}
          maxLength={120}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          disabled={busy}
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Surface type
        <Input
          value={value.courtType}
          minLength={2}
          maxLength={80}
          onChange={(event) =>
            onChange({ ...value, courtType: event.target.value })
          }
          placeholder="Indoor wooden court, synthetic turf…"
          disabled={busy}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Default duration
          <Input
            type="number"
            min="15"
            step="15"
            value={value.durationMinutes}
            onChange={(event) =>
              onChange({ ...value, durationMinutes: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Starting price
          <Input
            type="number"
            min="0"
            step="50"
            value={value.basePrice}
            onChange={(event) =>
              onChange({ ...value, basePrice: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Supported sports</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {sports.map((sport) => {
            const selected = value.sportIds.includes(sport.id);
            return (
              <label
                key={sport.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition",
                  selected
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-[#071020] text-muted-foreground",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSport(sport.id)}
                  disabled={busy}
                  className="accent-[#b8ff4f]"
                />
                {sport.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      {message ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={busy || value.sportIds.length === 0}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function RuleForm({
  value,
  court,
  onChange,
  onSubmit,
  busy,
  message,
  submitLabel,
}: {
  value: RuleDraft;
  court: OwnerCourtOperations;
  onChange: (next: RuleDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  message: string;
  submitLabel: string;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Sport
        <select
          value={value.sportId}
          onChange={(event) => {
            const row = court.sports.find(
              (item) => item.sport_id === event.target.value,
            );
            onChange({
              ...value,
              sportId: event.target.value,
              durationMinutes: String(
                row?.duration_minutes ??
                  court.default_duration_minutes ??
                  row?.sport.default_duration_minutes ??
                  60,
              ),
            });
          }}
          disabled={busy}
          required
          className="focus-ring h-12 rounded-xl border border-input bg-[#071020] px-4 text-sm text-foreground"
        >
          {court.sports
            .filter((row) => row.is_active)
            .map((row) => (
            <option key={row.sport_id} value={row.sport_id}>
              {row.sport.name}
            </option>
            ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Weekday
        <select
          value={value.weekday}
          onChange={(event) =>
            onChange({ ...value, weekday: event.target.value })
          }
          disabled={busy}
          className="focus-ring h-12 rounded-xl border border-input bg-[#071020] px-4 text-sm text-foreground"
        >
          {weekdays.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Opens
          <Input
            type="time"
            value={value.startLocal}
            onChange={(event) =>
              onChange({ ...value, startLocal: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Closes
          <Input
            type="time"
            value={value.endLocal}
            onChange={(event) =>
              onChange({ ...value, endLocal: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Slot minutes
          <Input
            type="number"
            min="15"
            step="15"
            value={value.durationMinutes}
            onChange={(event) =>
              onChange({ ...value, durationMinutes: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Slot price
          <Input
            type="number"
            min="0"
            step="50"
            value={value.priceTotal}
            onChange={(event) =>
              onChange({ ...value, priceTotal: event.target.value })
            }
            disabled={busy}
            required
          />
        </label>
      </div>

      <p className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
        Estimated Pllayz commission:{" "}
        <span className="font-semibold text-accent">
          {money.format(Number(value.priceTotal || 0) * 0.05)}
        </span>{" "}
        per completed booking. This is read-only until payments are built.
      </p>

      {message ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

export function OwnerSlotManager({
  ownerUserId,
  data,
}: {
  ownerUserId: string;
  data: OwnerVenueOperations;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [courtOpen, setCourtOpen] = useState(false);
  const [editingCourt, setEditingCourt] =
    useState<OwnerCourtOperations | null>(null);
  const [courtDraft, setCourtDraft] = useState(emptyCourtDraft);
  const [ruleCourt, setRuleCourt] = useState<OwnerCourtOperations | null>(null);
  const [editingRule, setEditingRule] =
    useState<WeeklyAvailabilityRule | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [blockingSlot, setBlockingSlot] = useState<
    (VenueSlot & { sport: Sport | null }) | null
  >(null);
  const [blockReason, setBlockReason] = useState("");

  const allSlots = useMemo(
    () => data.courts.flatMap((court) => court.slots),
    [data.courts],
  );
  const readiness = {
    image: data.images.length > 0,
    court: data.courts.some((court) => court.is_active),
    sport: data.courts.some((court) =>
      court.sports.some((sport) => sport.is_active),
    ),
  };
  const readyForReview = readiness.image && readiness.court && readiness.sport;

  function openNewCourt() {
    setEditingCourt(null);
    setCourtDraft(emptyCourtDraft);
    setMessage("");
    setCourtOpen(true);
  }

  function openEditCourt(court: OwnerCourtOperations) {
    setCourtOpen(false);
    setEditingCourt(court);
    setCourtDraft({
      name: court.name,
      courtType: court.court_type,
      durationMinutes: String(court.default_duration_minutes ?? 60),
      basePrice: String(court.base_price),
      sportIds: court.sports.filter((row) => row.is_active).map((row) => row.sport_id),
    });
    setMessage("");
  }

  function openNewRule(court: OwnerCourtOperations) {
    setEditingRule(null);
    setRuleCourt(court);
    setRuleDraft(ruleDraftForCourt(court));
    setMessage("");
  }

  function openEditRule(
    court: OwnerCourtOperations,
    rule: WeeklyAvailabilityRule,
  ) {
    setEditingRule(rule);
    setRuleCourt(court);
    setRuleDraft(ruleDraftForExisting(rule));
    setMessage("");
  }

  async function refreshSlots() {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("refresh_my_venue_slots", {
      p_venue_id: data.venue.id,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return false;
    }

    router.refresh();
    return true;
  }

  async function submitForReview() {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("submit_my_venue_for_review", {
      p_venue_id: data.venue.id,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  async function saveCourt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (courtDraft.sportIds.length === 0) {
      setMessage("Choose at least one supported sport.");
      return;
    }

    const invalidSelected = courtDraft.sportIds.filter(
      (id) =>
        !data.sports.some((sport) => sport.id === id && sport.is_active),
    );
    if (invalidSelected.length > 0) {
      setMessage("One or more selected sports are no longer active.");
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const courtId = editingCourt?.id ?? crypto.randomUUID();
    const courtPayload = {
      name: courtDraft.name.trim(),
      court_type: courtDraft.courtType.trim(),
      default_duration_minutes: Number(courtDraft.durationMinutes),
      base_price: Number(courtDraft.basePrice),
      is_active: true,
    };
    const courtMutation = editingCourt
      ? supabase.from("courts").update(courtPayload).eq("id", courtId)
      : supabase.from("courts").insert({
          id: courtId,
          venue_id: data.venue.id,
          ...courtPayload,
        });
    const { error: courtError } = await courtMutation;

    if (courtError) {
      setBusy(false);
      setMessage(courtError.message);
      return;
    }

    const existingIds = new Set(
      editingCourt?.sports.map((row) => row.sport_id) ?? [],
    );
    const additions = courtDraft.sportIds.filter((id) => !existingIds.has(id));
    const reactivations =
      editingCourt?.sports
        .filter(
          (row) => !row.is_active && courtDraft.sportIds.includes(row.sport_id),
        )
        .map((row) => row.sport_id) ?? [];
    const deactivations =
      editingCourt?.sports
        .filter(
          (row) => row.is_active && !courtDraft.sportIds.includes(row.sport_id),
        )
        .map((row) => row.sport_id) ?? [];
    const activeExisting =
      editingCourt?.sports
        .filter(
          (row) => row.is_active && courtDraft.sportIds.includes(row.sport_id),
        )
        .map((row) => row.sport_id) ?? [];

    if (reactivations.length > 0) {
      const { error } = await supabase
        .from("court_sports")
        .update({
          is_active: true,
          duration_minutes: Number(courtDraft.durationMinutes),
        })
        .eq("court_id", courtId)
        .in("sport_id", reactivations);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }

    if (activeExisting.length > 0) {
      const { error } = await supabase
        .from("court_sports")
        .update({ duration_minutes: Number(courtDraft.durationMinutes) })
        .eq("court_id", courtId)
        .in("sport_id", activeExisting);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }

    if (deactivations.length > 0) {
      const { error } = await supabase
        .from("court_sports")
        .update({ is_active: false })
        .eq("court_id", courtId)
        .in("sport_id", deactivations);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }

    if (additions.length > 0) {
      const { error } = await supabase.from("court_sports").insert(
        additions.map((sportId) => {
          const sport = data.sports.find((item) => item.id === sportId);
          return {
            court_id: courtId,
            sport_id: sportId,
            duration_minutes:
              Number(courtDraft.durationMinutes) ||
              sport?.default_duration_minutes ||
              60,
          };
        }),
      );
      if (error) {
        if (!editingCourt) await supabase.from("courts").delete().eq("id", courtId);
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }

    setBusy(false);
    setCourtOpen(false);
    setEditingCourt(null);
    router.refresh();
  }

  async function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ruleDraft) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const payload = {
      weekday: Number(ruleDraft.weekday),
      start_local: ruleDraft.startLocal,
      end_local: ruleDraft.endLocal,
      duration_minutes: Number(ruleDraft.durationMinutes),
      price_total: Number(ruleDraft.priceTotal),
      is_active: true,
    };
    const mutation = editingRule
      ? supabase
          .from("weekly_availability_rules")
          .update({ ...payload, sport_id: ruleDraft.sportId })
          .eq("id", editingRule.id)
      : supabase.from("weekly_availability_rules").insert({
          court_id: ruleDraft.courtId,
          sport_id: ruleDraft.sportId,
          created_by: ownerUserId,
          ...payload,
        });
    const { error } = await mutation;

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    const refreshed = await refreshSlots();
    setBusy(false);
    if (refreshed) {
      setRuleCourt(null);
      setEditingRule(null);
      setRuleDraft(null);
    }
  }

  async function toggleRule(rule: WeeklyAvailabilityRule) {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase
      .from("weekly_availability_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    await refreshSlots();
    setBusy(false);
  }

  async function deleteRule(rule: WeeklyAvailabilityRule) {
    if (!window.confirm("Delete this weekly availability rule?")) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase
      .from("weekly_availability_rules")
      .delete()
      .eq("id", rule.id);

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    await refreshSlots();
    setBusy(false);
  }

  async function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!blockingSlot) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("set_my_slot_block", {
      p_slot_id: blockingSlot.id,
      p_blocked: true,
      p_reason: blockReason,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBlockingSlot(null);
    setBlockReason("");
    router.refresh();
  }

  async function unblockSlot(slot: VenueSlot) {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("set_my_slot_block", {
      p_slot_id: slot.id,
      p_blocked: false,
      p_reason: null,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/owner/venues"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <HiArrowLeft className="size-4" />
          All venues
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={refreshSlots} disabled={busy}>
            <HiArrowPath className="size-4" />
            Refresh 7-day slots
          </Button>
          <Button
            size="sm"
            onClick={submitForReview}
            disabled={busy || !readyForReview || data.venue.status === "suspended"}
          >
            <HiShieldCheck className="size-4" />
            Submit for review
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <OwnerStatusBadge
            status={data.venue.status}
            decision={data.approval?.decision}
          />
          <p className="mt-5 text-xs text-muted-foreground">Venue status</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold">{data.courts.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Courts and turfs</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold">
            {allSlots.filter((slot) => slot.status === "available").length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Open slots</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-amber-300">
            {allSlots.filter((slot) => slot.status === "blocked").length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Offline blocks</p>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Review readiness</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Admin approval requires an image, an active court, and a supported sport.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={readiness.image ? "success" : "warning"}>
              <HiCheckBadge className="size-4" />
              Image
            </Badge>
            <Badge variant={readiness.court ? "success" : "warning"}>
              <HiCheckBadge className="size-4" />
              Court
            </Badge>
            <Badge variant={readiness.sport ? "success" : "warning"}>
              <HiCheckBadge className="size-4" />
              Sport
            </Badge>
          </div>
        </div>
      </Card>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Court operations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly rules generate future slots automatically. Held and booked slots stay locked.
          </p>
        </div>
        <Button onClick={openNewCourt}>
          <HiPlus className="size-4" />
          Add court
        </Button>
      </div>

      {data.courts.length > 0 ? (
        <div className="mt-4 grid gap-5">
          {data.courts.map((court) => (
            <Card key={court.id}>
              <CardHeader className="border-b border-border">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>{court.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {court.court_type} · {court.default_duration_minutes ?? 60} min
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {court.sports
                        .filter((row) => row.is_active)
                        .map((row) => (
                        <Badge key={row.sport_id} variant="neutral">
                          {row.sport.name}
                        </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">
                      {money.format(court.base_price)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Est. 5% fee {money.format(court.base_price * 0.05)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditCourt(court)}
                  >
                    <HiPencilSquare className="size-4" />
                    Edit court
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openNewRule(court)}
                    disabled={!court.sports.some((row) => row.is_active)}
                  >
                    <HiPlus className="size-4" />
                    Add weekly rule
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <h3 className="text-sm font-semibold">Weekly availability</h3>
                    {court.rules.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {court.rules.map((rule) => {
                          const sport = court.sports.find(
                            (row) => row.sport_id === rule.sport_id,
                          )?.sport;
                          return (
                            <div
                              key={rule.id}
                              className="rounded-xl border border-border bg-secondary/40 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {weekdays[rule.weekday]} · {sport?.name ?? "Sport"}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {rule.start_local.slice(0, 5)}–
                                    {rule.end_local.slice(0, 5)} · {rule.duration_minutes} min ·{" "}
                                    {money.format(rule.price_total)}
                                  </p>
                                </div>
                                <Badge variant={rule.is_active ? "success" : "neutral"}>
                                  {rule.is_active ? "Active" : "Paused"}
                                </Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditRule(court, rule)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleRule(rule)}
                                  disabled={busy}
                                >
                                  {rule.is_active ? "Pause" : "Resume"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteRule(rule)}
                                  disabled={busy}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No weekly rules yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Upcoming slots</h3>
                    {court.slots.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {court.slots.slice(0, 10).map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "rounded-xl border p-3",
                              slot.status === "blocked"
                                ? "border-amber-400/30 bg-amber-400/10"
                                : slot.status === "held" || slot.status === "booked"
                                  ? "border-red-400/30 bg-red-400/10"
                                  : "border-border bg-[#071020]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold">
                                  {slot.sport?.name ?? "Sport"}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {slotDate.format(new Date(slot.start_time))}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  slot.status === "available"
                                    ? "success"
                                    : slot.status === "blocked"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {slot.status}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-accent">
                                {money.format(slot.price_total)}
                              </p>
                              {slot.status === "available" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setBlockingSlot(slot);
                                    setBlockReason("");
                                    setMessage("");
                                  }}
                                >
                                  Block
                                </Button>
                              ) : slot.status === "blocked" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => unblockSlot(slot)}
                                  disabled={busy}
                                >
                                  Unblock
                                </Button>
                              ) : (
                                <span className="text-xs text-red-200">Locked</span>
                              )}
                            </div>
                            {slot.owner_block_reason ? (
                              <p className="mt-2 text-xs leading-5 text-amber-200">
                                {slot.owner_block_reason}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Add an active weekly rule to generate the next seven days.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-4 flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <HiCalendarDays className="size-8 text-accent" />
          <h3 className="mt-4 font-semibold">Add the first playable surface</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Courts, turfs and grounds hold sports, pricing, availability rules and slots.
          </p>
          <Button className="mt-5" onClick={openNewCourt}>
            <HiPlus className="size-4" />
            Add court
          </Button>
        </Card>
      )}

      {data.logs.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent operation history</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.logs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-xs last:border-0"
              >
                <span className="font-semibold">
                  {log.action.replaceAll("_", " ")}
                </span>
                <span className="text-muted-foreground">
                  {slotDate.format(new Date(log.created_at))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DialogDrawer
        open={courtOpen || Boolean(editingCourt)}
        onOpenChange={(open) => {
          if (!open) {
            setCourtOpen(false);
            setEditingCourt(null);
          }
        }}
        title={editingCourt ? `Edit ${editingCourt.name}` : "Add court or turf"}
        description="Supported sports share the same physical surface, so future booking holds will block overlaps across sports."
      >
        <CourtForm
          value={courtDraft}
          sports={data.sports}
          onChange={setCourtDraft}
          onSubmit={saveCourt}
          busy={busy}
          message={message}
          submitLabel={editingCourt ? "Save court" : "Add court"}
        />
      </DialogDrawer>

      <DialogDrawer
        open={Boolean(ruleCourt && ruleDraft)}
        onOpenChange={(open) => {
          if (!open) {
            setRuleCourt(null);
            setEditingRule(null);
            setRuleDraft(null);
          }
        }}
        title={editingRule ? "Edit weekly rule" : "Add weekly availability"}
        description={ruleCourt ? `${ruleCourt.name} · seven-day rolling generation` : ""}
      >
        {ruleCourt && ruleDraft ? (
          <RuleForm
            value={ruleDraft}
            court={ruleCourt}
            onChange={setRuleDraft}
            onSubmit={saveRule}
            busy={busy}
            message={message}
            submitLabel={editingRule ? "Save rule" : "Add rule"}
          />
        ) : null}
      </DialogDrawer>

      <DialogDrawer
        open={Boolean(blockingSlot)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingSlot(null);
            setBlockReason("");
          }
        }}
        title="Block this court time"
        description="The overlapping physical court window is blocked across all supported sports."
      >
        <form className="grid gap-4" onSubmit={saveBlock}>
          {blockingSlot ? (
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <HiClock className="size-4 text-accent" />
                {slotDate.format(new Date(blockingSlot.start_time))}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <HiCurrencyRupee className="size-4" />
                {money.format(blockingSlot.price_total)}
              </p>
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
            Reason
            <textarea
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              minLength={3}
              maxLength={240}
              rows={3}
              required
              disabled={busy}
              placeholder="Maintenance, private event, offline booking…"
              className="focus-ring rounded-xl border border-input bg-[#071020] px-4 py-3 text-sm text-foreground"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Blocking…" : "Block court time"}
          </Button>
        </form>
      </DialogDrawer>
    </>
  );
}
