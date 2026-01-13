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
import { Check, FileUp, X } from "lucide-react";
import qs from "qs";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

import { createPaste } from "../service";
import { ShareStorage } from "../utils/share-storage";
import CopyButton from "./copy-button";
import Editor from "./editor";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function TextShare() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [contentType, setContentType] = useState("auto");
  const [content, setContent] = useState("");
  const [expiration, setExpiration] = useState<number | undefined>(undefined);
  const [isProtected, setIsProtected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("fileSizeError"));
      return;
    }

    setUploading(true);
    const loadingId = toast.loading(t("uploading"));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${window.location.origin}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      toast.dismiss(loadingId);

      if (data.error) {
        toast.error(data.error);
        setUploading(false);
        return;
      }

      // 保存到历史
      ShareStorage.save({
        title: file.name,
        content: data.url,
        type: "file",
        fileName: file.name,
        fileSize: file.size,
      });

      // 设置上传结果
      setUploadedFile({
        url: data.url,
        name: file.name,
        size: file.size,
      });

      toast.success(t("uploadSuccess"));
      setUploading(false);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(t("uploadFailed"));
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

      {/* Upload Result Section */}
      {uploadedFile && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {t("uploadSuccess")}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-green-700 dark:text-green-300" />
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={uploadedFile.url}
              readOnly
              className="bg-white/80 dark:bg-gray-800/80 flex-1"
            />
            <CopyButton text={uploadedFile.url} />
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            {t("fileExpirationNotice")}
          </p>
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
