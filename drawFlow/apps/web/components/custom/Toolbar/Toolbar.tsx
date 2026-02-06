"use client";

import { useEditorStore } from "@/store/editor";
import { PiCursorFill } from "react-icons/pi";
import { FaRegHandPaper, FaRegSquare } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { MdOutlineHorizontalRule } from "react-icons/md";
import { LuDiamond } from "react-icons/lu";
import { FaArrowRightLong } from "react-icons/fa6";
import { LuEraser } from "react-icons/lu";
import { IoText } from "react-icons/io5";
import { FaRegCircle } from "react-icons/fa";
import { MdLockOpen, MdLockOutline } from "react-icons/md";

export default function Toolbar() {
  const currentTool = useEditorStore((s) => s.currentTool);
  const setTool = useEditorStore((s) => s.setTool);
  const isToolLocked = useEditorStore((s) => s.isToolLocked);
  const toggleToolLocked = useEditorStore((s) => s.toggleToolLocked);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2
    flex gap-2 items-center
    bg-white/90 dark:bg-[#1f1f1f]/90 backdrop-blur-md
    rounded-xl px-3 py-2
    shadow-lg shadow-black/10 dark:shadow-black/40
    ring-1 ring-black/5 dark:ring-white/10
    z-50"
    >
      <ToolButton
        label={isToolLocked ? "Unlock tool" : "Lock tool"}
        active={isToolLocked}
        onClick={toggleToolLocked}
        shortcut="Q"
      >
        {isToolLocked ? <MdLockOutline /> : <MdLockOpen />}
      </ToolButton>
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
      <ToolButton
        label="hand"
        active={currentTool === "hand"}
        onClick={() => setTool("hand")}
        shortcut="1"
      >
        <FaRegHandPaper />
      </ToolButton>
      <ToolButton
        label="Select"
        active={currentTool === "select"}
        onClick={() => setTool("select")}
        shortcut="2"
      >
        <PiCursorFill />
      </ToolButton>
      <ToolButton
        label="Rectangle"
        active={currentTool === "rect"}
        onClick={() => setTool("rect")}
        shortcut="3"
      >
        <FaRegSquare />
      </ToolButton>
      <ToolButton
        label="rhombus"
        active={currentTool === "rhombus"}
        onClick={() => setTool("rhombus")}
        shortcut="4"
      >
        <LuDiamond />
      </ToolButton>
      <ToolButton
        label="circle"
        active={currentTool === "circle"}
        onClick={() => setTool("circle")}
        shortcut="5"
      >
        <FaRegCircle />
      </ToolButton>
      <ToolButton
        label="arrow"
        active={currentTool === "arrow"}
        onClick={() => setTool("arrow")}
        shortcut="6"
      >
        <FaArrowRightLong />
      </ToolButton>
      <ToolButton
        label="line"
        active={currentTool === "line"}
        onClick={() => setTool("line")}
        shortcut="7"
      >
        <MdOutlineHorizontalRule />
      </ToolButton>
      <ToolButton
        label="pencil"
        active={currentTool === "pencil"}
        onClick={() => setTool("pencil")}
        shortcut="8"
      >
        <GoPencil />
      </ToolButton>
      <ToolButton
        label="text"
        active={currentTool === "text"}
        onClick={() => setTool("text")}
        shortcut="9"
      >
        <IoText />
      </ToolButton>

      <ToolButton
        label="eraser"
        active={currentTool === "eraser"}
        onClick={() => setTool("eraser")}
        shortcut="0"
      >
        <LuEraser />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  label,
  children,
  active,
  onClick,
  shortcut,
}: {
  label: string;
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  shortcut?: string;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-4 rounded outline-none focus-visible:outline-none focus-visible:ring-0 ${
        active
          ? "bg-[#c7f3e2] text-black dark:bg-[#2f3f3a] dark:text-[#c7f3e2]"
          : "bg-transparent text-black dark:text-gray-100"
      }`}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      <span className="relative flex items-center justify-center">
        {children}
        {shortcut ? (
          <span className="absolute -bottom-2 -right-2 text-[9px] leading-none text-gray-600 dark:text-gray-400">
            {shortcut}
          </span>
        ) : null}
      </span>
    </button>
  );
}
