import { Button } from "@/components/ui/button";
import { useQueryParams } from "../hooks/use-query-params";
import { Layers, Loader, TriangleAlert, ZapOff, RefreshCcw, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { INBOX_PARAM } from "../constants";
import { ThreadStatusWithAll } from "../types";
import { useThreadsContext } from "../contexts/ThreadContext";

const idleInboxesSVG = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 17H21.5L16.5 22H21.5M21.9506 13C21.9833 12.6711 22 12.3375 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.1677 22 12.3344 21.9959 12.5 21.9877C12.6678 21.9795 12.8345 21.9671 13 21.9506M12 6V12L15.7384 13.8692"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const INBOX_ICON_MAP = {
  all: <Layers />,
  interrupted: <ZapOff />,
  idle: idleInboxesSVG,
  busy: <Loader />,
  error: <TriangleAlert />,
};

function InboxButton({
  label,
  selectedInbox,
  onClick,
}: {
  label: string;
  selectedInbox: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "text-[16px] leading-6 font-medium",
        selectedInbox === label.toLowerCase() ? "text-black" : "text-gray-500"
      )}
      variant="ghost"
    >
      {INBOX_ICON_MAP[label.toLowerCase() as keyof typeof INBOX_ICON_MAP]}
      {label}
    </Button>
  );
}

export function InboxButtons({
  changeInbox,
}: {
  changeInbox: (inbox: ThreadStatusWithAll) => void;
}) {
  const { searchParams } = useQueryParams();
  const selectedInbox = searchParams ? searchParams.get(INBOX_PARAM) || "interrupted" : "interrupted";
  const { refreshThreadList, loading: isThreadListLoading } = useThreadsContext();

  return (
    <div className="flex w-full gap-2 items-center justify-start">
      <InboxButton
        label="All"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("all")}
      />
      <InboxButton
        label="Interrupted"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("interrupted")}
      />
      <InboxButton
        label="Idle"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("idle")}
      />
      <InboxButton
        label="Busy"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("busy")}
      />
      <InboxButton
        label="Error"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("error")}
      />
      <Button
        onClick={async () => {
          if (refreshThreadList) {
            await refreshThreadList();
          }
        }}
        variant="ghost"
        size="icon"
        disabled={isThreadListLoading}
        className="text-gray-500 hover:text-black"
      >
        {isThreadListLoading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCcw className="h-5 w-5" />
        )}
        <span className="sr-only">Refresh List</span>
      </Button>
    </div>
  );
}
