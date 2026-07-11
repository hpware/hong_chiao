import { Dispatch, SetStateAction } from "react";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import Link from "next/link";
import openai from "openai";

export default function AiSidebar({
  aiOpen,
  setAiOpen,
}: {
  aiOpen: boolean;
  setAiOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Sheet open={aiOpen} onOpenChange={setAiOpen}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">AI</SheetTitle>
        <AiSidebarContent />
      </SheetContent>
    </Sheet>
  );
}

function AiSidebarContent() {
  return <div>demo</div>;
}

function Client() {
  const aiSettings = {
    apiUrl: localStorage.getItem("ai_apiUrl") ?? "",
    apiToken: localStorage.getItem("ai_apiToken") ?? "",
    aiModel: localStorage.getItem("ai_model") ?? "",
    aiBypassCors: Boolean(localStorage.getItem("ai_bypassCors")) ?? false,
  };
  if (
    aiSettings.apiUrl.trim().length === 0 ||
    aiSettings.apiToken.trim().length === 0 ||
    aiSettings.aiModel.trim().length === 0
  ) {
    return (
      <div className="text-lg justify-center flex flex-row text-center absolute inset-0 items-center">
        <span>
          請先在
          <Link
            href="/settings#local_settings"
            className="text-blue-600 hover:text-blue-600/70 dark:text-blue-300 dark:hover:text-blue-300/70 underline transition-all duration-150"
          >
            設定
          </Link>
          先設定好 AI API, 模型和網址後再繼續
          {JSON.stringify(aiSettings)}
        </span>
      </div>
    );
  }
  return <div>聊天?</div>;
}
