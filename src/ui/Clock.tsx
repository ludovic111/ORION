import { useEffect, useState } from "react";
import { formatTime } from "../../shared/i18n/core.ts";
import { t } from "./i18n.ts";

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time
      className="clock"
      dateTime={now.toISOString()}
      title={t("Heure suisse")}
    >
      {formatTime(now, true)}
      <small>CH</small>
    </time>
  );
}
