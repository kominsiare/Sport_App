export type SportName =
  | "Cricket"
  | "Football"
  | "Badminton"
  | "Pickleball"
  | "Tennis";

export const sports: SportName[] = [
  "Cricket",
  "Football",
  "Badminton",
  "Pickleball",
  "Tennis",
];

export const cities = ["Chandigarh", "Mohali", "Panchkula"] as const;

export const mockVenue = {
  name: "Night Match Arena",
  area: "Sector 17 · Chandigarh",
  price: "From ₹1,800",
  sports: ["Cricket", "Football", "Badminton"] as SportName[],
  image: "/assets/night-match-hero.png",
};

export const bookingStatuses = [
  "requested",
  "owner_accepted",
  "owner_rejected",
  "expired",
  "payment_pending",
  "confirmed",
  "cancelled",
  "completed",
  "disputed",
  "refunded",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];
