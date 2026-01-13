import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Code, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { ShareItem, ShareStorage } from "../utils/share-storage";

interface ShareHistorySidebarProps {
  open: boolean;
  onClose: () => void;
}

// 根据内容类型获取颜色样式 (符合 Warm Academic Humanism)
const getTypeColor = (language?: string): string => {
  const lang = language?.toLowerCase() || "text";
  switch (lang) {
    case "html":
      return "bg-[#D67052]/20 text-[#D67052] dark:bg-[#D67052]/30 dark:text-[#E8947A]"; // Terracotta
    case "markdown":
    case "md":
      return "bg-[#F0B857]/20 text-[#B8860B] dark:bg-[#F0B857]/30 dark:text-[#F0B857]"; // Mustard
    case "svg":
      return "bg-[#1E3A5F]/20 text-[#1E3A5F] dark:bg-[#1E3A5F]/40 dark:text-[#6B8CAE]"; // Navy
    case "mermaid":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "javascript":
    case "js":
    case "typescript":
    case "ts":
    case "python":
    case "go":
    case "json":
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

// 智能提取标题
const extractSmartTitle = (content: string, language?: string): string => {
  const lang = language?.toLowerCase() || "text";

  // 对于 HTML，提取 <title> 标签
  if (lang === "html" || lang === "auto") {
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim()) {
      return titleMatch[1].trim().slice(0, 60);
    }
  }

  // 对于 Markdown，提取第一个 # 标题
  if (lang === "markdown" || lang === "md") {
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch && headingMatch[1].trim()) {
      return headingMatch[1].trim().slice(0, 60);
    }
  }

  // 对于 Mermaid，提取图表标题
  if (lang === "mermaid") {
    const lines = content.split("\n").filter((l) => l.trim());
    if (lines.length > 0) {
      return `Mermaid: ${lines[0].slice(0, 30)}...`;
    }
  }

  // 默认：使用第一行非空内容
  const firstLine = content.split("\n").find((line) => line.trim());
  if (firstLine) {
    // 去除 HTML 标签和特殊字符
    const cleanLine = firstLine.replace(/<[^>]+>/g, "").trim();
    return cleanLine.slice(0, 60) || language?.toUpperCase() || "Untitled";
  }

  return language?.toUpperCase() || "Untitled";
};

export default function ShareHistorySidebar({
  open,
  onClose,
}: ShareHistorySidebarProps) {
  const { t } = useTranslation();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShare, setSelectedShare] = useState<ShareItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open]);

  const loadShares = () => {
    const allShares = ShareStorage.getAll();
    setShares(allShares);
  };

  const filteredShares = shares.filter(
    (share) =>
      share.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    try {
      ShareStorage.delete(id);
      setShares((prev) => prev.filter((share) => share.id !== id));
      toast.success(t("shareDeleted"));
    } catch (error) {
      toast.error(t("deleteFailed"));
    }
  };

  const handleView = (share: ShareItem) => {
    setSelectedShare(share);
    setViewMode("preview"); // 默认打开预览模式
    setIsViewDialogOpen(true);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success(t("contentCopied"));
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const clearAll = () => {
    try {
      ShareStorage.clear();
      setShares([]);
      toast.success(t("allCleared"));
    } catch (error) {
      toast.error(t("clearFailed"));
    }
  };

  // 判断是否可以预览
  const canPreview = (language?: string): boolean => {
    const lang = language?.toLowerCase() || "";
    return ["html", "svg", "auto"].includes(lang);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary dark:text-[#E8947A]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {t("shareHistory")}
            </DialogTitle>
            <DialogDescription>
              {t("totalShares", { count: shares.length }) ||
                `共 ${shares.length} 个分享项目`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex gap-2">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/80 dark:bg-gray-900/80 focus:z-10"
              />
              {shares.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  {t("clearAll")}
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {filteredShares.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery ? t("noResults") : t("noShares")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {searchQuery
                      ? t("tryDifferentKeywords")
                      : t("autoSaveNotice")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredShares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${share.type === "text"
                                ? getTypeColor(share.language)
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              }`}
                          >
                            {share.type === "text"
                              ? share.language?.toUpperCase() || t("text")
                              : t("file")}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {extractSmartTitle(share.content, share.language)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>{formatDate(share.createdAt)}</span>
                          {share.fileSize && (
                            <span>
                              {t("fileSize")}: {formatFileSize(share.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(share)}
                        >
                          {t("view")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(share.content)}
                        >
                          {t("copy")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(share.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {extractSmartTitle(
                selectedShare?.content || "",
                selectedShare?.language,
              )}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedShare?.type === "text"
                    ? getTypeColor(selectedShare?.language)
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
              >
                {selectedShare?.type === "text"
                  ? selectedShare?.language?.toUpperCase() || t("text")
                  : t("file")}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t("createdAt")}:{" "}
              {selectedShare && formatDate(selectedShare.createdAt)}
              {selectedShare?.fileSize && (
                <span className="ml-4">
                  {t("fileSize")}: {formatFileSize(selectedShare.fileSize)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* 预览/源码切换标签 */}
          <div className="flex items-center justify-end mb-2">
            <div className="flex bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
              >
                <Eye className="h-3 w-3" />
                {t("preview")}
              </button>
              <button
                onClick={() => setViewMode("source")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "source"
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
              >
                <Code className="h-3 w-3" />
                {t("source")}
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "preview" ? (
              canPreview(selectedShare?.language) ? (
                <iframe
                  title="preview"
                  srcDoc={selectedShare?.content || ""}
                  sandbox="allow-scripts"
                  className="w-full h-96 bg-white rounded-lg border border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {selectedShare?.content}
                  </pre>
                </div>
              )
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedShare?.content}
                </pre>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() =>
                selectedShare && handleCopy(selectedShare.content)
              }
            >
              {t("copyContent")}
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
