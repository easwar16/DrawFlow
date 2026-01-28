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

export default function Toolbar() {
  const currentTool = useEditorStore((s) => s.currentTool);
  const setTool = useEditorStore((s) => s.setTool);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2
    flex gap-2 items-center
    bg-white/90 backdrop-blur-md
    rounded-xl px-3 py-2
    shadow-lg shadow-black/10
    ring-1 ring-black/5
    z-50"
    >
      <ToolButton
        label="hand"
        active={currentTool === "hand"}
        onClick={() => setTool("hand")}
      >
        <FaRegHandPaper />
      </ToolButton>
      <ToolButton
        label="Select"
        active={currentTool === "select"}
        onClick={() => setTool("select")}
      >
        <PiCursorFill />
      </ToolButton>
      <ToolButton
        label="Rectangle"
        active={currentTool === "rect"}
        onClick={() => setTool("rect")}
      >
        <FaRegSquare />
      </ToolButton>
      <ToolButton
        label="rhombus"
        active={currentTool === "rhombus"}
        onClick={() => setTool("rhombus")}
      >
        <LuDiamond />
      </ToolButton>
      <ToolButton
        label="circle"
        active={currentTool === "circle"}
        onClick={() => setTool("circle")}
      >
        <FaRegCircle />
      </ToolButton>
      <ToolButton
        label="arrow"
        active={currentTool === "arrow"}
        onClick={() => setTool("arrow")}
      >
        <FaArrowRightLong />
      </ToolButton>
      <ToolButton
        label="line"
        active={currentTool === "line"}
        onClick={() => setTool("line")}
      >
        <MdOutlineHorizontalRule />
      </ToolButton>
      <ToolButton
        label="pencil"
        active={currentTool === "pencil"}
        onClick={() => setTool("pencil")}
      >
        <GoPencil />
      </ToolButton>
      <ToolButton
        label="text"
        active={currentTool === "text"}
        onClick={() => setTool("text")}
      >
        <IoText />
      </ToolButton>

      <ToolButton
        label="eraser"
        active={currentTool === "eraser"}
        onClick={() => setTool("eraser")}
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
}: {
  label: string;
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded ${
        active ? "bg-[#b8f0d9] text-black" : "bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
