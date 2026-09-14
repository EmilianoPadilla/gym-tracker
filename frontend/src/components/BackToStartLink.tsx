import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BackToStartLink() {
  const { t } = useLanguage();
  return (
    <Link
      to="/"
      className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-sm text-chalkdim hover:border-brasslight hover:text-chalk transition-colors"
    >
      <HomeIcon />
      {t("backToToday")}
    </Link>
  );
}
