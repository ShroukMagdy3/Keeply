import { Folder, MoreVertical, Pencil, FolderInput, Archive, Trash } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  id: string;
  name: string;
  onOpen: (id: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onMove: (id: string) => void;
  onFreeze: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FolderCard({ id, name, onOpen, onRename, onMove, onFreeze, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      className="group relative flex items-center gap-3 bg-gray-800 hover:bg-gray-800/70 border border-gray-700/80 hover:border-amber-500/60 rounded-xl px-4 py-3 w-full sm:w-64 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-amber-500/20"
      onDoubleClick={() => onOpen(id, name)}
      onClick={() => onOpen(id, name)}
    >
      <div className="shrink-0 text-amber-400 group-hover:text-amber-300 transition-colors">
        <Folder size={28} fill="currentColor" className="opacity-90" />
      </div>
      <span className="flex-1 min-w-0 truncate text-gray-100 font-medium">{name}</span>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="text-gray-400 hover:text-amber-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-8 z-20 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={<Pencil size={14} />} label="Rename" onClick={() => { onRename(id, name); setMenuOpen(false); }} />
            <MenuItem icon={<FolderInput size={14} />} label="Move to..." onClick={() => { onMove(id); setMenuOpen(false); }} />
            <MenuItem icon={<Archive size={14} />} label="Move to bin" onClick={() => { onFreeze(id); setMenuOpen(false); }} />
            <MenuItem icon={<Trash size={14} />} label="Delete forever" danger onClick={() => { onDelete(id); setMenuOpen(false); }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-200 hover:bg-gray-800 hover:text-amber-400"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
