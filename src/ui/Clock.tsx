import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time className="clock" dateTime={now.toISOString()} title="Heure suisse">
      {now.toLocaleTimeString("fr-CH", {
        timeZone: "Europe/Zurich",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
      <small>CH</small>
    </time>
  );
}
