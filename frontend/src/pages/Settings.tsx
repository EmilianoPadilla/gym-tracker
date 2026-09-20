import { useState, useRef } from "react";
import BackToStartLink from "../components/BackToStartLink";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { useUnits } from "../units/UnitsContext";
import { api } from "../api/client";
import ImageCropperModal from "../components/ImageCropperModal";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { unit, setUnit } = useUnits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ""; // allow selecting the same file again later
  }

  async function handleCropConfirm(dataUrl: string) {
    setPendingImageSrc(null);
    setUploading(true);
    setError("");
    try {
      await api.updateProfile({ profile_picture: dataUrl });
      await refreshUser();
    } catch {
      setError("Could not update profile picture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-8">
        <h1 className="font-display text-3xl font-semibold">{t("settings")}</h1>
        <BackToStartLink />
      </div>

      <div className="mb-8">
        <p className="text-sm text-chalkdim mb-3">{t("profilePicture")}</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-panel border border-hairline overflow-hidden flex-shrink-0 flex items-center justify-center">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-chalkdim">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-panelraised border border-hairline px-4 py-2 text-sm disabled:opacity-60"
            >
              {uploading ? "..." : t("changePicture")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-chalkdim mb-3">{t("language")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              language === "en" ? "bg-brass text-chalk border-brass" : "border-hairline text-chalkdim"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              language === "es" ? "bg-brass text-chalk border-brass" : "border-hairline text-chalkdim"
            }`}
          >
            Español
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-chalkdim mb-3">{t("bodyMetricsUnit")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setUnit("kg")}
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              unit === "kg" ? "bg-brass text-chalk border-brass" : "border-hairline text-chalkdim"
            }`}
          >
            kg
          </button>
          <button
            onClick={() => setUnit("lbs")}
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              unit === "lbs" ? "bg-brass text-chalk border-brass" : "border-hairline text-chalkdim"
            }`}
          >
            lbs
          </button>
        </div>
        <p className="text-xs text-chalkdim mt-3">{t("perExerciseUnitNote")}</p>
      </div>

      {pendingImageSrc && (
        <ImageCropperModal
          imageSrc={pendingImageSrc}
          onCancel={() => setPendingImageSrc(null)}
          onConfirm={handleCropConfirm}
          saveLabel={t("save")}
          cancelLabel={language === "es" ? "Cancelar" : "Cancel"}
        />
      )}
    </div>
  );
}
