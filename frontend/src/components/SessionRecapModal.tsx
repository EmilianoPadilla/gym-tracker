import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import DurationPicker from "./DurationPicker";

const DAY_TYPES = [
  "Push day",
  "Pull day",
  "Legs - Quad focus",
  "Upper body",
  "Lower body",
  "Legs - Hamstring focus",
  "Chest",
  "Back",
  "Arms",
];

type Step = "dayType" | "duration" | "cardio" | "cardioDuration" | "preview";

function formatDuration(hours: number, minutes: number): string {
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

async function waitForFont(): Promise<void> {
  try {
    await document.fonts.load("700 80px Oswald");
    await document.fonts.ready;
  } catch {
    // If font loading fails for some reason, canvas just falls back to a default font
  }
}

function drawStat(ctx: CanvasRenderingContext2D, cx: number, y: number, label: string, value: string) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "600 34px 'Work Sans', sans-serif";
  ctx.fillText(label, cx, y);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 90px Oswald, sans-serif";
  ctx.fillText(value, cx, y + 100);
}

function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  const totalHeight = lines.length * lineHeight;
  let y = startY - totalHeight / 2 + lineHeight / 2 + 40;
  for (const l of lines) {
    ctx.fillText(l, cx, y);
    y += lineHeight;
  }
}

function drawRecapImage(dayType: string, totalTime: string, cardioTime: string | null): string {
  const canvas = document.createElement("canvas");
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // No background fill at all - canvas starts fully transparent, so this can
  // be layered on top of a regular photo afterward, like Strava's overlays.

  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = "#EDE7DD";
  ctx.font = "600 32px 'Work Sans', sans-serif";
  ctx.fillText("TODAY'S SESSION", W / 2, 220);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 100px Oswald, sans-serif";
  wrapCenteredText(ctx, dayType.toUpperCase(), W / 2, 340, W - 160, 108);

  ctx.strokeStyle = "rgba(237, 231, 221, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 560);
  ctx.lineTo(W - 140, 560);
  ctx.stroke();

  let statY = 680;
  drawStat(ctx, W / 2, statY, "TOTAL TIME", totalTime);
  if (cardioTime) {
    statY += 220;
    drawStat(ctx, W / 2, statY, "CARDIO", cardioTime);
  }

  ctx.strokeStyle = "rgba(237, 231, 221, 0.6)";
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, H - 160);
  ctx.lineTo(W / 2 + 60, H - 160);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 46px Oswald, sans-serif";
  const brand = "GYM TRACKER";
  const letterSpacing = 8;
  ctx.textAlign = "left";
  const totalWidth = [...brand].reduce((w, c) => w + ctx.measureText(c).width + letterSpacing, -letterSpacing);
  let x = W / 2 - totalWidth / 2;
  for (const char of brand) {
    ctx.fillText(char, x, H - 100);
    x += ctx.measureText(char).width + letterSpacing;
  }

  return canvas.toDataURL("image/png");
}

export default function SessionRecapModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("dayType");
  const [dayType, setDayType] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [cardioHours, setCardioHours] = useState(0);
  const [cardioMinutes, setCardioMinutes] = useState(20);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function finishAndGenerate(cardioTime: string | null) {
    setGenerating(true);
    await waitForFont();
    const url = drawRecapImage(dayType!, formatDuration(hours, minutes), cardioTime);
    setImageUrl(url);
    setGenerating(false);
    setStep("preview");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="bg-panel border border-hairline rounded-xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {step === "dayType" && (
          <>
            <p className="text-chalk font-semibold mb-4">{t("whatDidYouTrainToday")}</p>
            <div className="flex flex-col gap-2">
              {DAY_TYPES.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDayType(d);
                    setStep("duration");
                  }}
                  className="text-left rounded-lg border border-hairline px-3 py-2.5 text-sm text-chalk hover:border-brasslight"
                >
                  {d}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="mt-4 text-chalkdim text-sm w-full text-center">
              {t("cancel")}
            </button>
          </>
        )}

        {step === "duration" && (
          <>
            <p className="text-chalk font-semibold mb-4">{t("howLongWasYourSession")}</p>
            <DurationPicker hours={hours} minutes={minutes} onChangeHours={setHours} onChangeMinutes={setMinutes} />
            <button
              onClick={() => setStep("cardio")}
              className="mt-5 w-full rounded-lg bg-brass text-chalk font-semibold py-2.5 text-sm"
            >
              {t("continueLabel")}
            </button>
          </>
        )}

        {step === "cardio" && (
          <>
            <p className="text-chalk font-semibold mb-4">{t("didYouDoCardio")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => finishAndGenerate(null)}
                className="flex-1 rounded-lg border border-hairline text-chalkdim py-2.5 text-sm font-semibold"
              >
                {t("no")}
              </button>
              <button
                onClick={() => setStep("cardioDuration")}
                className="flex-1 rounded-lg bg-brass text-chalk py-2.5 text-sm font-semibold"
              >
                {t("yes")}
              </button>
            </div>
          </>
        )}

        {step === "cardioDuration" && (
          <>
            <p className="text-chalk font-semibold mb-4">{t("howLongWasYourCardio")}</p>
            <DurationPicker
              hours={cardioHours}
              minutes={cardioMinutes}
              onChangeHours={setCardioHours}
              onChangeMinutes={setCardioMinutes}
            />
            <button
              onClick={() => finishAndGenerate(formatDuration(cardioHours, cardioMinutes))}
              className="mt-5 w-full rounded-lg bg-brass text-chalk font-semibold py-2.5 text-sm"
            >
              {generating ? "..." : t("generateImage")}
            </button>
          </>
        )}

        {step === "preview" && imageUrl && (
          <>
            <img src={imageUrl} alt="Session recap" className="w-full rounded-lg mb-4" />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-hairline text-chalkdim py-2.5 text-sm font-semibold"
              >
                {t("close")}
              </button>
              <a
                href={imageUrl}
                download="gym-tracker-session.png"
                className="flex-1 rounded-lg bg-brass text-chalk py-2.5 text-sm font-semibold text-center"
              >
                {t("download")}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
