import { createServerFn } from "@tanstack/react-start";

// Who receives notifications for each barber's agenda (by barber name).
const RECIPIENTS_BY_BARBER: Record<string, string[]> = {
  JUNIOR: ["juniorjosias2018@gmail.com"],
  DOUGLAS: ["douglasmachadodigao@gmail.com"],
};
const ALL_BOOKINGS_RECIPIENTS = ["natanvivian39@gmail.com"];

export function recipientsFor(barberName: string): string[] {
  const key = barberName.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [...new Set([...(RECIPIENTS_BY_BARBER[key] ?? []), ...ALL_BOOKINGS_RECIPIENTS])];
}

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export const notifyNewBooking = createServerFn({ method: "POST" })
  .inputValidator((input: { bookingId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input?.bookingId ?? "")) throw new Error("Invalid booking");
    return input;
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const fcmKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!lovableKey || !fcmKey) return { sent: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin
      .from("bookings")
      .select("id, created_at, customer_name, service_name, booking_date, booking_time, barbers(name)")
      .eq("id", data.bookingId)
      .maybeSingle();
    // Only notify for bookings created in the last 2 minutes (prevents replays).
    if (!b || Date.now() - new Date(b.created_at).getTime() > 120_000) return { sent: 0 };
    const barberName = (b.barbers as { name: string } | null)?.name ?? "";
    const { data: tokens } = await supabaseAdmin.from("push_tokens").select("token").in("email", recipientsFor(barberName));
    const [y, m, d] = b.booking_date.split("-");
    let sent = 0;
    for (const { token } of tokens ?? []) {
      const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": fcmKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: `Novo agendamento — ${barberName}`,
              body: `${b.customer_name} · ${b.service_name} · ${d}/${m} às ${b.booking_time.slice(0, 5)}`,
            },
            webpush: { fcm_options: { link: "/admin" } },
          },
        }),
      });
      if (res.ok) sent++;
      else {
        const body = await res.text();
        console.error(`FCM send failed [${res.status}]: ${body}`);
        if (res.status === 404 || res.status === 400) await supabaseAdmin.from("push_tokens").delete().eq("token", token);
      }
    }
    return { sent };
  });
