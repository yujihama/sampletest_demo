import { cn } from "@/lib/utils";
import { InterruptedThreadData } from "../types";
import React from "react";
import { format } from "date-fns";
import { useQueryParams } from "../hooks/use-query-params";
import { IMPROPER_SCHEMA, VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { ThreadIdCopyable } from "./thread-id";

interface InterruptedInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: InterruptedThreadData<ThreadValues>;
  isLast: boolean;
  onThreadClick: (id: string) => void;
}

export const InterruptedInboxItem = <ThreadValues extends Record<string, any>>({
  threadData,
  isLast,
  onThreadClick,
}: InterruptedInboxItem<ThreadValues>) => {
  const { updateQueryParams } = useQueryParams();
  const firstInterrupt = threadData.interrupts?.[0];

  const descriptionPreview = firstInterrupt?.description?.slice(0, 65);
  const descriptionTruncated =
    firstInterrupt?.description && firstInterrupt.description.length > 65;

  const action = firstInterrupt?.action_request?.action;
  const title = !action || action === IMPROPER_SCHEMA ? "Interrupt" : action;
  const hasNoDescription =
    !firstInterrupt ||
    (!firstInterrupt.description && !threadData.invalidSchema);

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MM/dd h:mm a"
  );

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default click behavior

    // Call the onThreadClick callback first to save scroll position
    if (onThreadClick) {
      onThreadClick(threadData.thread.thread_id);
    }

    // Navigate immediately using the NextJS router approach
    // The scroll option is set to false in updateQueryParams to prevent auto-scrolling
    updateQueryParams(
      VIEW_STATE_THREAD_QUERY_PARAM,
      threadData.thread.thread_id
    );
  };

  const hasDescriptionValue =
    descriptionPreview ||
    descriptionTruncated ||
    (!firstInterrupt && threadData.invalidSchema);

  return (
    <div
      key={threadData.thread.thread_id}
      onClick={handleThreadClick}
      className={cn(
        "grid grid-cols-12 w-full p-4 items-center cursor-pointer hover:bg-gray-50/90 transition-colors ease-in-out h-[71px]",
        !isLast && "border-b border-gray-200"
      )}
    >
      {/* Column 1: Dot - adjusted span slightly */}
      <div className="col-span-1 flex justify-center">
        <div className="w-[6px] h-[6px] rounded-full bg-blue-400" />
      </div>

      {/* Column 2-9: Title and Description - merged spans */}
      <div className="col-span-8 overflow-hidden">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-black truncate pr-1">
            {title}
          </span>

          {threadData.invalidSchema && (
            <div className="ml-2">
              <ThreadIdCopyable
                showUUID
                threadId={threadData.thread.thread_id}
              />
            </div>
          )}
        </div>
        {hasDescriptionValue && (
          <div className="text-sm text-muted-foreground truncate h-[18px]">
            {descriptionPreview}
            {descriptionTruncated && "..."}
            {!firstInterrupt && threadData.invalidSchema && (
              <i>Invalid interrupt data - cannot display details.</i>
            )}
            {hasNoDescription && <span>&nbsp;</span>}
          </div>
        )}
      </div>

      {/* Column 11-12: Timestamp - adjusted span */}
      <p className="col-span-2 text-right text-sm text-gray-600 font-light">
        {updatedAtDateString}
      </p>
    </div>
  );
};
