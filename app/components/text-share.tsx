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
import qs from "qs";
import { useState } from "react";
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

      {/* Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              value={isProtected ? "Password will be generated" : ""}
              placeholder="No password"
              disabled={true}
              className="bg-white/80 dark:bg-gray-900/80"
            />
          </div>

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
                <SelectItem value="60">1 min</SelectItem>
                <SelectItem value="300">5 mins</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="86400">1 day</SelectItem>
                <SelectItem value="604800">1 week</SelectItem>
                <SelectItem value="2592000">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground h-5 flex items-center">
              Type
            </label>
            <Select
              value={contentType}
              onValueChange={(value) => setContentType(value)}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Detect</SelectItem>
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            {publishing ? "Creating..." : "Create Paste"}
          </Button>
        </div>
      </div>
    </div>
  );
}
