import { Edit2, Check, X } from "lucide-react";
import { useState } from "react";

interface Props {
  workspaceName: string;
  createdAt: string;
  onUpdate: (newName: string) => void;
}

export default function WorkspaceHeader({ workspaceName, createdAt, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(workspaceName);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== workspaceName) {
      onUpdate(newName.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setNewName(workspaceName);
    setEditing(false);
  };

  return (
    <div className="mt-6 flex w-full min-w-0 items-center justify-between gap-4 rounded-2xl bg-gray-800 p-5 sm:p-6">
      {editing ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex gap-2 sm:shrink-0">
            <button
              onClick={handleSave}
              className="rounded-lg bg-amber-500 p-2 text-gray-900 transition-colors hover:bg-amber-600"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg bg-gray-700 p-2 text-gray-200 transition-colors hover:bg-gray-600"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 break-words text-2xl font-semibold text-amber-400 [overflow-wrap:anywhere]">
              {workspaceName}
            </h1>
            <p className="text-sm text-gray-500">
              Created {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-amber-500 hover:text-amber-400 p-2 rounded-xl transition-colors"
            title="Rename workspace"
          >
            <Edit2 size={18} />
          </button>
        </>
      )}
    </div>
  );
}
