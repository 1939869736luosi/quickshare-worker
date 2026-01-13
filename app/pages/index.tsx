import { memo } from "react";
import { useTranslation } from "react-i18next";

import TextShare from "../components/text-share";

export default memo(function CreatePaste() {
  const { t } = useTranslation();

  return (
    <div className="bg-background paper-texture min-h-[calc(100vh-4rem)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            {t("createAndShare")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("shareDescription")}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
          <div className="p-6">
            <TextShare />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-card rounded-lg shadow-sm border border-border/50">
            <div className="w-12 h-12 bg-[#D67052] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              {t("lightningFast")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("lightningFastDesc")}
            </p>
          </div>

          <div className="text-center p-6 bg-card rounded-lg shadow-sm border border-border/50">
            <div className="w-12 h-12 bg-[#F0B857] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              {t("secureAndPrivate")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("secureAndPrivateDesc")}
            </p>
          </div>

          <div className="text-center p-6 bg-card rounded-lg shadow-sm border border-border/50">
            <div className="w-12 h-12 bg-[#1E3A5F] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              {t("syntaxHighlighting")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("syntaxHighlightingDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
