import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "wouter";

import CopyButton from "../components/copy-button";
import Editor from "../components/editor";
import { getPaste, updatePaste } from "../service";

export default function Detail() {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [pasteData, setPasteData] = useState<any>();
  const [contentType, setContentType] = useState("html");
  const [isAuth, setIsAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");

  const { id } = useParams();
  const [, navigate] = useLocation();
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const urlPassword = params.get("password") || params.get("share_password");

  useEffect(() => {
    if (!id) return;
    getPaste(id, urlPassword).then((data: any) => {
      if (data.error) {
        if (data.code === 403) {
          if (!urlPassword) {
            setIsAuth(false);
          } else {
            toast.error(t("passwordIncorrect"));
          }
          return;
        }
        toast.error(data.error);
        return;
      }
      setPasteData(data);
      setContent(data.content);
      setContentType(data.content_type || data.language || "html");
    });
    if (history.state?.edit_password) {
      setEditPassword(history.state.edit_password);
    }
    if (params.get("edit_password")) {
      setEditPassword(params.get("edit_password") || "");
    }
  }, [id]);

  const handleSubmitPassword = async () => {
    location.search = `?password=${passwordInput}`;
  };

  const handleUpdatePaste = async () => {
    const data = await updatePaste({
      id,
      content,
      edit_password: editPassword,
      content_type: contentType,
    });
    if (data.error) {
      toast.error(data.error);
      return;
    }
    toast.success(t("updated"));
  };

  const previewUrl = useMemo(() => {
    if (!id) return "";
    const passwordQuery = pasteData?.is_protected
      ? `?password=${encodeURIComponent(urlPassword || passwordInput || "")}`
      : "";
    return `${window.location.origin}/view/${id}${passwordQuery}`;
  }, [id, pasteData?.is_protected, urlPassword, passwordInput]);

  const rawUrl = useMemo(() => {
    if (!id) return "";
    const passwordQuery = pasteData?.is_protected
      ? `?password=${encodeURIComponent(urlPassword || passwordInput || "")}`
      : "";
    return `${window.location.origin}/raw/${id}${passwordQuery}`;
  }, [id, pasteData?.is_protected, urlPassword, passwordInput]);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-gray-700 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("passwordRequired")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t("passwordProtectedMsg")}
            </p>
            <div className="space-y-4">
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t("enterPassword")}
                className="w-full"
              />
              <Button onClick={handleSubmitPassword} className="w-full">
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {contentType.toUpperCase()} Preview
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(
                        pasteData?.create_time || Date.now(),
                      ).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {contentType}
                    </span>
                    <span>•</span>
                    <span>
                      {pasteData?.is_protected ? `🔒 ${t("protected")}` : `🌐 ${t("public")}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {t("createNew")}
                </Button>
                <CopyButton
                  text={`${window.location.origin}/view/${id}`}
                  size="sm"
                  variant="outline"
                >
                  <span className="sm:hidden">{t("url")}</span>
                  <span className="hidden sm:inline">{t("copyPreviewUrl")}</span>
                </CopyButton>
                {pasteData?.is_protected && urlPassword && (
                  <CopyButton text={urlPassword} size="sm" variant="outline">
                    <span className="sm:hidden">{t("pwd")}</span>
                    <span className="hidden sm:inline">{t("pwd")}</span>
                  </CopyButton>
                )}
                {editPassword && (
                  <CopyButton
                    text={`${window.location.origin}/detail/${id}?edit_password=${editPassword}`}
                    size="sm"
                    variant="outline"
                  >
                    <span className="sm:hidden">{t("admin")}</span>
                    <span className="hidden sm:inline">{t("adminUrl")}</span>
                  </CopyButton>
                )}
                <CopyButton text={content} size="sm" variant="outline">
                  <span className="sm:hidden">{t("copy")}</span>
                  <span className="hidden sm:inline">{t("copyRawText")}</span>
                </CopyButton>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(rawUrl)}
                >
                  <span className="sm:hidden">{t("raw")}</span>
                  <span className="hidden sm:inline">{t("viewRawText")}</span>
                </Button>
                {editPassword && (
                  <Button
                    size="sm"
                    onClick={handleUpdatePaste}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t("update")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("content")}
            </span>
            <div className="flex bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "preview"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
              >
                <Eye className="h-3 w-3" />
                {t("preview")}
              </button>
              <button
                onClick={() => setViewMode("source")}
                className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "source"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
              >
                <Code className="h-3 w-3" />
                {t("source")}
              </button>
            </div>
          </div>

          <div className={viewMode === "preview" ? "p-0" : "p-4"}>
            {viewMode === "preview" ? (
              <iframe
                title="preview"
                src={previewUrl}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                className="w-full h-[70vh] bg-white"
              />
            ) : (
              <Editor
                height="calc(70vh)"
                language={contentType}
                value={content}
                readonly={!editPassword}
                onChange={(value) => setContent(value || "")}
                showFullscreenButton={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
