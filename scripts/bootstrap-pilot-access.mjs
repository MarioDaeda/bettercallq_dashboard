import { createClient } from "@supabase/supabase-js";

const PILOT_SALON_ID =
  "10000000-0000-4000-8000-000000000001";
const PILOT_PLAN_ID =
  "20000000-0000-4000-8000-000000000001";
const PILOT_SUBSCRIPTION_ID =
  "30000000-0000-4000-8000-000000000001";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "ADMIN_USER_ID",
  "SALON_OWNER_USER_ID",
];

for (const name of requiredVariables) {
  if (!process.env[name]) {
    console.error(`Variabile mancante: ${name}`);
    process.exit(1);
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

for (const name of ["ADMIN_USER_ID", "SALON_OWNER_USER_ID"]) {
  if (!uuidPattern.test(process.env[name])) {
    console.error(`UUID non valido: ${name}`);
    process.exit(1);
  }
}

if (process.env.ADMIN_USER_ID === process.env.SALON_OWNER_USER_ID) {
  console.error("Admin e proprietario devono essere utenti distinti.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

function localDateParts(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());

  return Object.fromEntries(
    parts
      .filter(({ type }) =>
        ["day", "month", "year"].includes(type),
      )
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function formatDate(year, month, day) {
  return [
    year.toString().padStart(4, "0"),
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}

function currentCalendarMonth(timeZone) {
  const { year, month } = localDateParts(timeZone);
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    end: formatDate(year, month, endDay),
    start: formatDate(year, month, 1),
  };
}

async function getAuthUser(userId, label) {
  const { data, error } =
    await supabase.auth.admin.getUserById(userId);

  if (error || !data.user) {
    throw new Error(
      `${label}: ${error?.message ?? "utente non trovato"}`,
    );
  }

  return data.user;
}

async function updateAuthMetadata(
  user,
  appMetadata,
) {
  const { error } =
    await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        ...appMetadata,
      },
      email_confirm: true,
    });

  if (error) {
    throw new Error(
      `Aggiornamento Auth ${user.email}: ${error.message}`,
    );
  }
}

async function upsert(table, values, options) {
  const { error } = await supabase
    .from(table)
    .upsert(values, options);

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

const adminDisplayName =
  process.env.ADMIN_DISPLAY_NAME?.trim() || "Mario";
const ownerDisplayName =
  process.env.SALON_OWNER_DISPLAY_NAME?.trim() ||
  "Parrucchiere pilota";

try {
  const [adminUser, ownerUser] = await Promise.all([
    getAuthUser(process.env.ADMIN_USER_ID, "Admin"),
    getAuthUser(
      process.env.SALON_OWNER_USER_ID,
      "Proprietario",
    ),
  ]);

  await Promise.all([
    updateAuthMetadata(adminUser, {
      app_role: "admin",
      display_name: adminDisplayName,
    }),
    updateAuthMetadata(ownerUser, {
      app_role: "salon_owner",
      display_name: ownerDisplayName,
      salon_id: PILOT_SALON_ID,
    }),
  ]);

  await upsert(
    "salons",
    {
      address: {
        city: "Forlì",
        country: "IT",
        postalCode: "47121",
        province: "FC",
        street: "Via Esempio 10",
      },
      id: PILOT_SALON_ID,
      locale: "it-IT",
      name: "Studio Chioma Demo",
      phone_number: "+390000000001",
      slug: "studio-chioma-demo",
      status: "active",
      timezone: "Europe/Rome",
      whatsapp_number: "+390000000002",
    },
    {
      onConflict: "id",
    },
  );

  await upsert(
    "subscription_plans",
    {
      active: true,
      billing_cycle_type: "calendar_month",
      code: "pilot-300",
      extra_minute_price_cents: null,
      id: PILOT_PLAN_ID,
      included_voice_minutes: 300,
      name: "Piano pilota 300 minuti",
    },
    {
      onConflict: "id",
    },
  );

  const period = currentCalendarMonth("Europe/Rome");

  await upsert(
    "salon_subscriptions",
    {
      id: PILOT_SUBSCRIPTION_ID,
      plan_id: PILOT_PLAN_ID,
      salon_id: PILOT_SALON_ID,
      starts_on: period.start,
      status: "active",
    },
    {
      onConflict: "id",
    },
  );

  await upsert(
    "usage_periods",
    {
      calculated_at: new Date().toISOString(),
      included_voice_minutes: 300,
      period_end: period.end,
      period_start: period.start,
      salon_id: PILOT_SALON_ID,
      subscription_id: PILOT_SUBSCRIPTION_ID,
      used_voice_seconds: 0,
    },
    {
      onConflict: "salon_id,period_start,period_end",
    },
  );

  await upsert(
    "profiles",
    [
      {
        display_name: adminDisplayName,
        platform_role: "admin",
        user_id: adminUser.id,
      },
      {
        display_name: ownerDisplayName,
        platform_role: "standard",
        user_id: ownerUser.id,
      },
    ],
    {
      onConflict: "user_id",
    },
  );

  await upsert(
    "salon_memberships",
    {
      role: "owner",
      salon_id: PILOT_SALON_ID,
      status: "active",
      user_id: ownerUser.id,
    },
    {
      onConflict: "salon_id,user_id",
    },
  );

  console.log("Bootstrap completato.");
  console.log(`Admin: ${adminUser.email}`);
  console.log(`Proprietario: ${ownerUser.email}`);
  console.log(`Salone: ${PILOT_SALON_ID}`);
  console.log(`Periodo: ${period.start} → ${period.end}`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
