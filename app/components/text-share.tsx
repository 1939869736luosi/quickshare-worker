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
import { FileUp, Image, Film, Music, FileText, X } from "lucide-react";
import qs from "qs";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

import { createPaste } from "../service";
import { ShareStorage } from "../utils/share-storage";
import CopyButton from "./copy-button";
import Editor from "./editor";

// 文本文件的扩展名
const TEXT_EXTENSIONS = ['html', 'htm', 'md', 'markdown', 'svg', 'mermaid', 'mmd', 'txt', 'css', 'js', 'ts', 'json', 'xml'];
// 二进制文件大小限制 25MB
const BINARY_FILE_MAX = 25 * 1024 * 1024;
// 文本文件大小限制 1MB
const TEXT_FILE_MAX = 1 * 1024 * 1024;

interface BinaryFile {
  url: string;
  name: string;
  size: number;
  type: string; // MIME type
}

export default function TextShare() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [contentType, setContentType] = useState("auto");
  const [content, setContent] = useState("");
  const [expiration, setExpiration] = useState<number | undefined>(undefined);
  const [isProtected, setIsProtected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [binaryFile, setBinaryFile] = useState<BinaryFile | null>(null);
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

  // 判断是否是文本文件
  const isTextFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    // 检查扩展名
    if (TEXT_EXTENSIONS.includes(ext)) return true;
    // 检查 MIME type
    if (file.type.startsWith('text/')) return true;
    if (file.type === 'application/json' || file.type === 'application/xml') return true;
    return false;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      if (isTextFile(file)) {
        // 文本文件：限制 1MB
        if (file.size > TEXT_FILE_MAX) {
          toast.error(t("textFileSizeError"));
          setUploading(false);
          return;
        }

        // 读取内容到编辑器
        const text = await file.text();
        const detectedType = detectFileType(file.name, text);
        setContent(text);
        setContentType(detectedType);
        setBinaryFile(null); // 清除可能存在的二进制文件
        toast.success(t("fileLoaded"));
      } else {
        // 二进制文件：上传到 R2，限制 25MB
        if (file.size > BINARY_FILE_MAX) {
          toast.error(t("binaryFileSizeError"));
          setUploading(false);
          return;
        }

        const loadingId = toast.loading(t("uploading"));

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

        // 设置二进制文件预览
        setBinaryFile({
          url: data.url,
          name: file.name,
          size: file.size,
          type: file.type,
        });
        setContent(''); // 清空编辑器
        toast.success(t("fileUploaded"));
      }

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

      {/* Binary File Preview Section */}
      {binaryFile && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {binaryFile.type.startsWith('image/') ? (
                <Image className="w-6 h-6 text-primary" />
              ) : binaryFile.type.startsWith('video/') ? (
                <Film className="w-6 h-6 text-primary" />
              ) : binaryFile.type.startsWith('audio/') ? (
                <Music className="w-6 h-6 text-primary" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
              <div>
                <p className="font-medium">{binaryFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(binaryFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setBinaryFile(null)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Media Preview */}
          {binaryFile.type.startsWith('image/') && (
            <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center" style={{ maxHeight: '300px' }}>
              <img src={binaryFile.url} alt={binaryFile.name} className="max-w-full max-h-[300px] object-contain" />
            </div>
          )}
          {binaryFile.type.startsWith('video/') && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <video src={binaryFile.url} controls className="w-full max-h-[300px]" />
            </div>
          )}
          {binaryFile.type.startsWith('audio/') && (
            <div className="mb-4">
              <audio src={binaryFile.url} controls className="w-full" />
            </div>
          )}

          {/* URL Copy Section */}
          <div className="flex gap-2">
            <Input
              value={binaryFile.url}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-900"
            />
            <CopyButton text={binaryFile.url} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("fileExpirationNotice")}
          </p>
        </div>
      )
      }

      {/* Type Badge - shown when type is detected */}
      {
        contentType !== "auto" && content && (
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
        )
      }

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
    </div >
  );
}
