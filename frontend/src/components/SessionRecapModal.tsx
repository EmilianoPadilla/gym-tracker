import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Media } from "@capacitor-community/media";
import { useLanguage } from "../i18n/LanguageContext";
import DurationPicker from "./DurationPicker";

type Step = "totalTimeChoice" | "customDuration" | "cardio" | "cardioDuration" | "preview";

// Total session time: "2h 20m", or just "45m" if under an hour.
function formatSessionTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Cardio is always shown as plain total minutes, e.g. "20m" - no hour split.
function formatCardioTime(hours: number, minutes: number): string {
  return `${hours * 60 + minutes}m`;
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

function drawRecapImage(dayName: string, totalTime: string, cardioTime: string | null): string {
  const canvas = document.createElement("canvas");
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // No background fill at all - canvas stays fully transparent, so this can
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
  wrapCenteredText(ctx, dayName.toUpperCase(), W / 2, 340, W - 160, 108);

  ctx.strokeStyle = "rgba(237, 231, 221, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 490);
  ctx.lineTo(W - 140, 490);
  ctx.stroke();

  let statY = 610;
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

export default function SessionRecapModal({
  dayName,
  sessionMinutes,
  onClose,
}: {
  dayName: string;
  sessionMinutes: number;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("totalTimeChoice");
  const [finalTotalMinutes, setFinalTotalMinutes] = useState(sessionMinutes);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [cardioHours, setCardioHours] = useState(0);
  const [cardioMinutes, setCardioMinutes] = useState(20);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function finishAndGenerate(cardioTime: string | null) {
    setGenerating(true);
    await waitForFont();
    const url = drawRecapImage(dayName, formatSessionTime(finalTotalMinutes), cardioTime);
    setImageUrl(url);
    setGenerating(false);
    setStep("preview");
  }

  async function handleSaveImage() {
    if (!imageUrl) return;
    setSaveStatus("saving");
    try {
      if (Capacitor.isNativePlatform()) {
        // Saves straight to the Photos/Gallery app - no share sheet, no
        // extra tap needed from the person using it.
        await Media.savePhoto({ path: imageUrl });
        setSaveStatus("done");
      } else {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = "gym-tracker-session.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSaveStatus("done");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="bg-panel border border-hairline rounded-xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {step === "totalTimeChoice" && (
          <>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setFinalTotalMinutes(sessionMinutes);
                  setStep("cardio");
                }}
                disabled={sessionMinutes <= 0}
                className="rounded-lg bg-brass text-chalk font-semibold py-2.5 text-sm disabled:opacity-40 text-left px-4"
              >
                {t("useTrackedTime")}: {formatSessionTime(sessionMinutes)}
              </button>
              <button
                onClick={() => setStep("customDuration")}
                className="rounded-lg border border-hairline text-chalk font-semibold py-2.5 text-sm text-left px-4"
              >
                {t("enterCustomTime")}
              </button>
            </div>
            <button onClick={onClose} className="mt-4 text-chalkdim text-sm w-full text-center">
              {t("cancel")}
            </button>
          </>
        )}

        {step === "customDuration" && (
          <>
            <p className="text-chalk font-semibold mb-4">{t("howLongWasYourSession")}</p>
            <DurationPicker
              hours={customHours}
              minutes={customMinutes}
              onChangeHours={setCustomHours}
              onChangeMinutes={setCustomMinutes}
            />
            <button
              onClick={() => {
                setFinalTotalMinutes(customHours * 60 + customMinutes);
                setStep("cardio");
              }}
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
            <button onClick={onClose} className="mt-4 text-chalkdim text-sm w-full text-center">
              {t("cancel")}
            </button>
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
              onClick={() => finishAndGenerate(formatCardioTime(cardioHours, cardioMinutes))}
              className="mt-5 w-full rounded-lg bg-brass text-chalk font-semibold py-2.5 text-sm"
            >
              {generating ? "..." : t("generateImage")}
            </button>
          </>
        )}

        {step === "preview" && imageUrl && (
          <div
            className="-m-5 p-5 rounded-xl"
            style={{
              backgroundColor: "#8c8c8c",
              backgroundImage:
                "linear-gradient(45deg, #bfbfbf 25%, transparent 25%), linear-gradient(-45deg, #bfbfbf 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #bfbfbf 75%), linear-gradient(-45deg, transparent 75%, #bfbfbf 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            <img src={imageUrl} alt="Session recap" className="w-full rounded-lg mb-4" />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-panel border border-hairline text-chalk py-2.5 text-sm font-semibold"
              >
                {t("close")}
              </button>
              <button
                onClick={handleSaveImage}
                disabled={saveStatus === "saving"}
                className="flex-1 rounded-lg bg-brass text-chalk py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {saveStatus === "saving" ? "..." : t("download")}
              </button>
            </div>
            {saveStatus === "error" && (
              <p className="text-red-400 text-xs text-center mt-2">Something went wrong saving the image.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
