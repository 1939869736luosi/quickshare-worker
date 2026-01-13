import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp } from "lucide-react";
import qs from "qs";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

import { createPaste } from "../service";
import { ShareStorage } from "../utils/share-storage";
import Editor from "./editor";

export default function TextShare() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [contentType, setContentType] = useState("auto");
  const [content, setContent] = useState("");
  const [expiration, setExpiration] = useState<number | undefined>(undefined);
  const [isProtected, setIsProtected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPB = async () => {
    if (!content) return toast.error(t("pleaseEnterContent"));
    setPublishing(true);
    try {
      const data = await createPaste({
        content,
        expire: expiration,
        is_protected: isProtected,
        content_type: contentType,
      });

      // 保存到本地存储
      const title =
        content.split("\n")[0].slice(0, 50) || `${contentType} ${t("share")}`;
      ShareStorage.save({
        title,
        content,
        type: "text",
        language: contentType,
      });

      setPublishing(false);
      if (isProtected && data?.password) {
        toast.success(`Password: ${data.password}`);
      }
      navigate(
        `/detail/${data.id}${qs.stringify(
          isProtected && data?.password ? { password: data.password } : {},
          { addQueryPrefix: true },
        )}`,
        {
          state: { edit_password: data.edit_password, password: data.password },
        },
      );
    } catch (error) {
      setPublishing(false);
      toast.error(t("createFailed"));
    }
  };

  const handleSetAsProtected = (checked: boolean) => {
    setIsProtected(checked);
  };

  // 根据文件扩展名和内容检测类型
  const detectFileType = (fileName: string, content: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    // 根据扩展名检测
    if (ext === 'html' || ext === 'htm') return 'html';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    if (ext === 'svg') return 'svg';
    if (ext === 'mermaid' || ext === 'mmd') return 'mermaid';

    // 根据内容检测
    if (content.trim().startsWith('<!DOCTYPE html') || content.trim().startsWith('<html')) return 'html';
    if (content.trim().startsWith('<svg')) return 'svg';
    if (content.includes('```mermaid') || content.match(/^(graph|flowchart|sequenceDiagram|classDiagram)/m)) return 'mermaid';
    if (content.match(/^#+ /m)) return 'markdown';

    return 'auto';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小 (文本文件限制 1MB)
    const TEXT_FILE_MAX = 1 * 1024 * 1024;
    if (file.size > TEXT_FILE_MAX) {
      toast.error(t("fileSizeError"));
      return;
    }

    setUploading(true);

    try {
      // 读取文件内容为文本
      const text = await file.text();

      // 检测文件类型
      const detectedType = detectFileType(file.name, text);

      // 设置编辑器内容和类型
      setContent(text);
      setContentType(detectedType);

      toast.success(t("fileLoaded"));
      setUploading(false);
    } catch (error) {
      toast.error(t("fileReadError"));
      setUploading(false);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Editor Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-0 overflow-hidden">
        <Editor
          className="rounded-lg border-0"
          height="400px"
          language={contentType === "auto" ? "html" : contentType}
          onChange={(value) => setContent(value || "")}
          value={content}
          showFullscreenButton={true}
        />
      </div>

      {/* Type Badge - shown when type is detected */}
      {contentType !== "auto" && content && (
        <div className="flex justify-end">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${contentType === 'html' ? 'bg-primary/20 text-primary' :
              contentType === 'markdown' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                contentType === 'svg' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  contentType === 'mermaid' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
            &lt;/&gt; {contentType.toUpperCase()}
          </span>
        </div>
      )}

      {/* Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 上传文件按钮 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground h-5 flex items-center">
              {t("uploadFile")}
            </label>
            <label
              htmlFor="file-upload-input"
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md cursor-pointer bg-white/80 dark:bg-gray-900/80 border-dashed border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileUp className="w-4 h-4" />
              {uploading ? t("uploading") : t("selectFile")}
            </label>
            <input
              id="file-upload-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="*"
              disabled={uploading}
            />
          </div>

          {/* 是否私有 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 h-5">
              <Checkbox
                checked={isProtected}
                onCheckedChange={handleSetAsProtected}
              />
              <label className="text-sm font-medium text-foreground">
                {t("privateTip")}
              </label>
            </div>
            <Input
              value={isProtected ? t("passwordGenerated") : ""}
              placeholder={t("noPassword")}
              disabled={true}
              className="bg-white/80 dark:bg-gray-900/80"
            />
          </div>

          {/* 过期时间 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground h-5 flex items-center">
              {t("expiration")}
            </label>
            <Select
              value={expiration?.toString()}
              onValueChange={(value) => setExpiration(Number(value))}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                <SelectValue placeholder={t("expiration")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 {t("min")}</SelectItem>
                <SelectItem value="300">5 {t("mins")}</SelectItem>
                <SelectItem value="3600">1 {t("hour")}</SelectItem>
                <SelectItem value="86400">1 {t("day")}</SelectItem>
                <SelectItem value="604800">1 {t("week")}</SelectItem>
                <SelectItem value="2592000">1 {t("month")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground h-5 flex items-center">
              {t("type")}
            </label>
            <Select
              value={contentType}
              onValueChange={(value) => setContentType(value)}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                <SelectValue placeholder={t("type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t("autoDetect")}</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="mermaid">Mermaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={createPB}
            disabled={publishing || !content}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-colors"
          >
            {publishing ? t("uploading") : t("createPaste")}
          </Button>
        </div>
      </div>
    </div>
  );
}
