import { useEffect, useState } from "react";
import { ChevronRight, Folder, Home, X, FolderInput } from "lucide-react";
import { listContents, moveDocument, type BreadcrumbItem, type DriveItem } from "../../api/documents";
import toast from "react-hot-toast";
import { ClipLoader } from "react-spinners";

interface Props {
  docId: string;
  docName: string;
  workspaceId: string;
  onClose: () => void;
  onMoved: () => void;
}

export default function MoveModal({ docId, docName, workspaceId, onClose, onMoved }: Props) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  const load = async (id: string | null) => {
    setLoading(true);
    try {
      const data = await listContents(id, workspaceId);
      setBreadcrumb(data.breadcrumb || []);
      setFolders((data.items || []).filter((i) => i.type === "folder" && i._id !== docId));
    } catch {
      toast.error("Couldn't load folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(folderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const handleMove = async () => {
    setMoving(true);
    try {
      await moveDocument(docId, folderId);
      toast.success(`Moved "${docName}"`);
      onMoved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't move it there");
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-amber-400 font-semibold flex items-center gap-2">
            <FolderInput size={18} /> Move "{docName}"
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-5 py-3 text-sm text-gray-400 overflow-x-auto border-b border-gray-800">
          <button onClick={() => setFolderId(null)} className="flex items-center gap-1 hover:text-amber-400 shrink-0">
            <Home size={14} /> Root
          </button>
          {breadcrumb.map((b) => (
            <span key={b.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight size={14} />
              <button onClick={() => setFolderId(b.id)} className="hover:text-amber-400 truncate max-w-[8rem]">
                {b.name}
              </button>
            </span>
          ))}
        </div>

        <div className="px-5 py-4 min-h-[160px] max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <ClipLoader size={28} color="#fbbf24" />
            </div>
          ) : folders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No subfolders here</p>
          ) : (
            <div className="flex flex-col gap-1">
              {folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => setFolderId(f._id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800 hover:text-amber-400 transition-colors text-left"
                >
                  <Folder size={16} className="text-amber-500" />
                  <span className="truncate">{f.name}</span>
                  <ChevronRight size={14} className="ml-auto text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold transition-colors disabled:opacity-60"
          >
            {moving ? "Moving..." : "Move here"}
          </button>
        </div>
      </div>
    </div>
  );
}
