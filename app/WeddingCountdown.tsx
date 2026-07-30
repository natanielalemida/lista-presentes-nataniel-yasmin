"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  WEDDING_DATE_ISO,
  WEDDING_DATE_LONG_LABEL,
} from "./wedding";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

function calculateTimeLeft(): TimeLeft {
  const difference = new Date(WEDDING_DATE_ISO).getTime() - Date.now();
  const safeDifference = Math.max(0, difference);

  return {
    days: Math.floor(safeDifference / 86_400_000),
    hours: Math.floor((safeDifference / 3_600_000) % 24),
    minutes: Math.floor((safeDifference / 60_000) % 60),
    seconds: Math.floor((safeDifference / 1_000) % 60),
    complete: difference <= 0,
  };
}

export function WeddingCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTimeLeft(calculateTimeLeft());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const units = [
    { label: "dias", value: timeLeft?.days },
    { label: "horas", value: timeLeft?.hours },
    { label: "minutos", value: timeLeft?.minutes },
    { label: "segundos", value: timeLeft?.seconds },
  ];

  return (
    <section className="countdown" aria-labelledby="countdown-title">
      <div className="countdown-copy">
        <p className="eyebrow">Está chegando</p>
        <h2 id="countdown-title">
          {timeLeft?.complete ? "Chegou o nosso grande dia!" : "Contando para o nosso sim"}
        </h2>
        <time dateTime={WEDDING_DATE_ISO}>{WEDDING_DATE_LONG_LABEL}</time>
      </div>

      <div
        className="countdown-timer"
        role="timer"
        aria-label={
          timeLeft?.complete
            ? "Chegou o dia do casamento"
            : `${timeLeft?.days ?? 0} dias, ${timeLeft?.hours ?? 0} horas, ${timeLeft?.minutes ?? 0} minutos e ${timeLeft?.seconds ?? 0} segundos para o casamento`
        }
      >
        {units.map((unit) => (
          <div className="countdown-unit" key={unit.label}>
            <strong>{unit.value == null ? "—" : String(unit.value).padStart(2, "0")}</strong>
            <span>{unit.label}</span>
          </div>
        ))}
      </div>

      <Heart aria-hidden="true" className="countdown-heart" size={26} strokeWidth={1.25} />
    </section>
  );
}
