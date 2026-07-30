import { GiftRegistry } from "./GiftRegistry";
import { gifts } from "./gifts";
import { availabilityFromClaims, listAllClaims } from "./lib/giftClaims";

export const dynamic = "force-dynamic";

export default async function Home() {
  const weddingConfig = {
    whatsappNumber:
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "",
  };

  let initialAvailability = availabilityFromClaims([]);
  let initialAvailabilityIsFresh = false;

  try {
    initialAvailability = availabilityFromClaims(await listAllClaims());
    initialAvailabilityIsFresh = true;
  } catch (error) {
    console.error("Unable to preload gift availability", error);
  }

  return (
    <GiftRegistry
      gifts={gifts}
      config={weddingConfig}
      initialAvailability={initialAvailability}
      initialAvailabilityIsFresh={initialAvailabilityIsFresh}
    />
  );
}
