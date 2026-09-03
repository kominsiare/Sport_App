import {
  HiBanknotes,
  HiCheckBadge,
  HiReceiptPercent,
  HiShieldCheck,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { BookingStatusBadge } from "@/components/marketplace/booking-status-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOwnerDashboardData } from "@/lib/owner/server";

const activityDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default async function OwnerRequestsPage() {
  const { logs, bookingHolds, payments, bookings, commissions } =
    await getOwnerDashboardData();
  const paymentById = new Map(
    payments.map((payment) => [payment.id, payment]),
  );
  const commissionByBooking = new Map(
    commissions.map((commission) => [commission.booking_id, commission]),
  );

  return (
    <PageShell
      eyebrow="Owner · Activity"
      title="Bookings, payments and operations"
      description="Confirmed bookings are created only after Razorpay’s signed captured-payment webhook. Payment and commission values are read-only."
    >
      <Card className="overflow-hidden border-emerald-400/25">
        <div className="border-b border-emerald-400/20 bg-emerald-400/8 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="success">
                <HiCheckBadge className="size-4" />
                Webhook confirmed
              </Badge>
              <h2 className="mt-4 font-semibold">Confirmed bookings</h2>
            </div>
            <Badge variant="neutral">{bookings.length} total</Badge>
          </div>
        </div>
        {bookings.length > 0 ? (
          <div className="grid gap-3 p-5">
            {bookings.map((booking) => {
              const payment = paymentById.get(booking.payment_id) ?? null;
              const commission =
                commissionByBooking.get(booking.id) ?? null;
              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-border bg-secondary/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="success">Confirmed</Badge>
                        {payment ? (
                          <PaymentStatusBadge status={payment.status} />
                        ) : null}
                        <Badge variant="neutral">
                          {booking.snapshot_sport_name}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        {booking.snapshot_venue_name} ·{" "}
                        {booking.snapshot_court_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activityDate.format(
                          new Date(booking.snapshot_start_time),
                        )}{" "}
                        · {booking.snapshot_duration_minutes} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {money.format(booking.snapshot_advance_amount)} paid
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {money.format(booking.snapshot_total_amount)} booking
                      </p>
                    </div>
                  </div>
                  {commission ? (
                    <div className="mt-4 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                      <span>
                        Pllayz fee:{" "}
                        <strong className="text-foreground">
                          {money.format(commission.commission_amount)}
                        </strong>
                      </span>
                      <span>
                        Owner advance credit:{" "}
                        <strong className="text-foreground">
                          {money.format(commission.owner_advance_credit)}
                        </strong>
                      </span>
                      <span>
                        Manual owner due:{" "}
                        <strong
                          className={
                            commission.owner_due_amount > 0
                              ? "text-amber-300"
                              : "text-foreground"
                          }
                        >
                          {money.format(commission.owner_due_amount)}
                        </strong>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">
            Verified paid bookings will appear here.
          </p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Player payment holds</h2>
          <Badge variant="neutral">Read-only</Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Owners can see court demand, but cannot accept, reject, or inspect
          Player contact details.
        </p>
        {bookingHolds.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {bookingHolds.map((hold) => (
              <div
                key={hold.id}
                className="rounded-xl border border-border bg-secondary/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={hold.status} />
                      <Badge variant="neutral">
                        {hold.snapshot_sport_name}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      {hold.snapshot_venue_name} · {hold.snapshot_court_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activityDate.format(new Date(hold.snapshot_start_time))} ·{" "}
                      {hold.snapshot_duration_minutes} min
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    {money.format(hold.snapshot_total_amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No Player payment holds have reached your venues yet.
          </p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Operations audit</h2>
          <Badge variant="neutral">Append-only</Badge>
        </div>
        {logs.length > 0 ? (
          <div className="mt-4 grid gap-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-semibold">
                  {log.action.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityDate.format(new Date(log.created_at))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            No owner operations have been recorded yet.
          </p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <HiShieldCheck className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">
                <HiReceiptPercent className="size-4" />
                5% commission
              </Badge>
              <Badge variant="neutral">
                <HiBanknotes className="size-4" />
                Manual settlement beta
              </Badge>
            </div>
            <h2 className="mt-4 font-semibold">Advance-first commission</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pllayz collects its 5% fee from the ₹500 advance first. If the fee
              exceeds ₹500, the remaining amount is tracked as owner due for
              manual reconciliation.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
