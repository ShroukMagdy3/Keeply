import { useEffect, useRef, useState, useCallback } from "react";
import DocumentCard from "../documentCard/documentCard";
import FolderCard from "../documentCard/folderCard";
import NewFolderModal from "./newFolderModal";
import MoveModal from "./moveModal";
import {
  listContents,
  createFolder,
  uploadFileGeneric,
  uploadFolderBulk,
  updateDocumentName,
  deleteDocument,
  softDeleteDocument,
  searchDocuments,
  type BreadcrumbItem,
  type DriveItem,
} from "../../api/documents";
import {
  File,
  Home,
  ChevronRight,
  FolderPlus,
  FileUp,
  FolderUp,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";

interface Props {
  workspaceId: string;
  onDocumentsChanged?: () => void;
}

const DEBOUNCE_DELAY = 500;

export default function DocumentList({ workspaceId, onDocumentsChanged }: Props) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchResults, setSearchResults] = useState<DriveItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingFolder, setUploadingFolder] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [folderAction, setFolderAction] = useState<{ id: string; name: string; action: "freeze" | "delete" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const folderPickerTimeoutRef = useRef<number | null>(null);
  const uploadStatusTimeoutRef = useRef<number | null>(null);
  const folderUploadStartedRef = useRef(false);

  const isSearching = searchName.trim() !== "" || searchType !== "";

  const load = useCallback(async (folderId: string | null) => {
    setLoading(true);
    try {
      const data = await listContents(folderId, workspaceId);
      setBreadcrumb(data.breadcrumb || []);
      setItems(data.items || []);
    } catch {
      toast.error("Couldn't load this folder");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load(currentFolderId);
  }, [currentFolderId, workspaceId, load]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "true");
      folderInputRef.current.setAttribute("directory", "true");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (folderPickerTimeoutRef.current) clearTimeout(folderPickerTimeoutRef.current);
      if (uploadStatusTimeoutRef.current) clearTimeout(uploadStatusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isSearching) {
      setSearchResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchDocuments({
          name: searchName.trim() || undefined,
          type: searchType || undefined,
          workspaceId,
        });
        setSearchResults(data.documents || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, DEBOUNCE_DELAY);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, searchType, workspaceId]);

  const refresh = () => {
    load(currentFolderId);
    onDocumentsChanged?.();
  };
  const handleOpenFolder = (id: string) => setCurrentFolderId(id);

  const clearUploadStatusSoon = () => {
    if (uploadStatusTimeoutRef.current) clearTimeout(uploadStatusTimeoutRef.current);
    uploadStatusTimeoutRef.current = window.setTimeout(() => {
      setUploadStatus("");
      uploadStatusTimeoutRef.current = null;
    }, 2200);
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name, currentFolderId, workspaceId);
      toast.success(`"${name}" created`);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't create that folder");
      throw err;
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFile(true);
    setUploadStatus(`Uploading "${file.name}"...`);
    try {
      await uploadFileGeneric(file, currentFolderId, workspaceId);
      toast.success(`"${file.name}" uploaded`);
      setUploadStatus(`Loaded "${file.name}"`);
      clearUploadStatusSoon();
      refresh();
    } catch (err: any) {
      const message = getUploadErrorMessage(err);
      toast.error(message);
      setUploadStatus(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const openFolderPicker = () => {
    folderUploadStartedRef.current = false;
    setUploadingFolder(true);
    setUploadStatus("Choose a folder to upload...");
    folderInputRef.current?.click();
    const resetIfCanceled = () => {
      folderPickerTimeoutRef.current = window.setTimeout(() => {
        if (!folderUploadStartedRef.current && !folderInputRef.current?.files?.length) {
          setUploadingFolder(false);
          setUploadStatus("");
        }
        window.removeEventListener("focus", resetIfCanceled);
      }, 700);
    };
    window.addEventListener("focus", resetIfCanceled);
  };

  const handleUploadFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (folderPickerTimeoutRef.current) {
      clearTimeout(folderPickerTimeoutRef.current);
      folderPickerTimeoutRef.current = null;
    }

    const files = Array.from(e.target.files || []);
    folderUploadStartedRef.current = files.length > 0;
    e.target.value = "";

    if (files.length === 0) {
      setUploadStatus("");
      setUploadingFolder(false);
      return;
    }

    setUploadingFolder(true);
    const folderName = ((files[0] as any).webkitRelativePath || "").split("/")[0] || "folder";
    setUploadStatus(`Preparing "${folderName}" (${files.length} files)...`);
    try {
      const data = await uploadFolderBulk(files, currentFolderId, workspaceId, (status) => {
        setUploadStatus(`"${folderName}": ${status}`);
      });
      const uploadedCount = data.uploaded ?? files.length;
      toast.success(`${uploadedCount} files uploaded`);
      setUploadStatus(`Loaded "${folderName}" (${uploadedCount} files)`);
      clearUploadStatusSoon();
      refresh();
    } catch (err: any) {
      const message = getUploadErrorMessage(err);
      toast.error(message);
      setUploadStatus(message);
    } finally {
      setUploadingFolder(false);
    }
  };

  const handleFolderRename = async (id: string, currentName: string) => {
    const next = window.prompt("Rename folder", currentName);
    if (!next || !next.trim() || next.trim() === currentName) return;
    try {
      await updateDocumentName(id, next.trim());
      toast.success("Renamed");
      refresh();
    } catch {
      toast.error("Couldn't rename that folder");
    }
  };

  const handleFolderFreeze = async (id: string) => {
    try {
      await softDeleteDocument(id);
      toast.success("Moved to Cycle Bin");
      refresh();
    } catch {
      toast.error("Couldn't freeze that folder");
    }
  };

  const handleFolderDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success("Deleted");
      refresh();
    } catch {
      toast.error("Couldn't delete that folder");
    }
  };

  const confirmFolderAction = async () => {
    if (!folderAction) return;
    const action = folderAction.action;
    const id = folderAction.id;
    setFolderAction(null);
    if (action === "freeze") {
      await handleFolderFreeze(id);
      return;
    }
    await handleFolderDelete(id);
  };

  const handleFileDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    onDocumentsChanged?.();
  };

  const isBusy = uploadingFile || uploadingFolder;
  const folders = items.filter((i) => i.type === "folder");
  const files = items.filter((i) => i.type === "file");
  const sortedFiles = [...files].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortNewestFirst ? -diff : diff;
  });

  return (
    <div className="flex min-h-screen justify-center text-white">
      <div className="w-full max-w-6xl px-2 py-4 sm:px-4 lg:px-6 lg:py-6">
        <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-gray-950/80 p-3 shadow-lg shadow-black/20 md:flex-row md:items-center md:p-4">
          <input
            type="text"
            placeholder="Search everything in this workspace..."
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 md:flex-1"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />

          <select
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-500 md:w-40"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="pdf">PDF</option>
            <option value="raw">Audio / Other</option>
          </select>

          {!isSearching && (
            <button
              onClick={() => setSortNewestFirst((v) => !v)}
              title={sortNewestFirst ? "Newest first" : "Oldest first"}
              className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              <ArrowUpDown size={16} />
            </button>
          )}
        </div>

        {isSearching ? (
          <SearchResults loading={searchLoading} results={searchResults} onDelete={handleFileDelete} />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-gray-900/70 p-3 shadow-md shadow-black/20 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
              <nav className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto pb-1 text-sm text-gray-400 lg:flex-1 lg:pb-0">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap transition ${currentFolderId === null ? "font-semibold text-amber-400" : "hover:text-amber-400"}`}
                >
                  <Home size={15} /> My Files
                </button>
                {breadcrumb.map((b) => (
                  <span key={b.id} className="flex min-w-0 shrink-0 items-center gap-1 whitespace-nowrap">
                    <ChevronRight size={14} className="shrink-0" />
                    <button
                      onClick={() => setCurrentFolderId(b.id)}
                      className={`max-w-[150px] truncate sm:max-w-[220px] lg:max-w-[280px] ${b.id === currentFolderId ? "font-semibold text-amber-400" : "hover:text-amber-400"}`}
                      title={b.name}
                    >
                      {b.name}
                    </button>
                  </span>
                ))}
              </nav>

              <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                <ToolbarButton icon={<FolderPlus size={16} />} label="New folder" onClick={() => setShowNewFolder(true)} />
                <ToolbarButton icon={uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} label={uploadingFile ? "Uploading..." : "Upload file"} onClick={() => fileInputRef.current?.click()} disabled={isBusy} />
                <ToolbarButton icon={uploadingFolder ? <Loader2 size={16} className="animate-spin" /> : <FolderUp size={16} />} label={uploadingFolder ? "Uploading folder..." : "Upload folder"} onClick={openFolderPicker} disabled={isBusy} primary />
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />
                <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleUploadFolder} />
              </div>
            </div>

            {uploadStatus && (
              <div className="sticky top-3 z-20 mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-gray-950 px-4 py-3 text-sm font-medium text-amber-200 shadow-xl shadow-black/30">
                {isBusy && <Loader2 size={16} className="animate-spin" />}
                <span className="break-words [overflow-wrap:anywhere]">{uploadStatus}</span>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[200px] items-center justify-center">
                <ClipLoader size={50} color="#fbbf24" />
              </div>
            )}

            {!loading && folders.length === 0 && files.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-800 bg-gray-900/80 py-16 text-center">
                <div className="text-7xl text-amber-500">
                  <File />
                </div>
                <p className="mt-5 text-2xl font-semibold text-gray-100">This folder is empty</p>
                <p className="mt-2 text-sm text-gray-500">Create a new folder or upload your first file to begin.</p>
              </div>
            )}

            {!loading && folders.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Folders</h2>
                <div className="flex flex-wrap gap-3">
                  {folders.map((f) => (
                    <FolderCard
                      key={f._id}
                      id={f._id}
                      name={f.name}
                      onOpen={handleOpenFolder}
                      onRename={handleFolderRename}
                      onMove={(id) => setMoveTarget({ id, name: f.name })}
                      onFreeze={(id) => setFolderAction({ id, name: f.name, action: "freeze" })}
                      onDelete={(id) => setFolderAction({ id, name: f.name, action: "delete" })}
                    />
                  ))}
                </div>
              </div>
            )}

            {!loading && sortedFiles.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Files</h2>
                <div className="flex flex-col gap-3">
                  {sortedFiles.map((doc) => (
                    <DocumentCard
                      key={doc._id}
                      doc={doc as any}
                      onDelete={handleFileDelete}
                      onMove={(id, name) => setMoveTarget({ id, name })}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showNewFolder && <NewFolderModal onClose={() => setShowNewFolder(false)} onCreate={handleCreateFolder} />}
      {folderAction && (
        <FolderActionModal
          action={folderAction.action}
          name={folderAction.name}
          onCancel={() => setFolderAction(null)}
          onConfirm={confirmFolderAction}
        />
      )}
      {moveTarget && (
        <MoveModal
          docId={moveTarget.id}
          docName={moveTarget.name}
          workspaceId={workspaceId}
          onClose={() => setMoveTarget(null)}
          onMoved={refresh}
        />
      )}
    </div>
  );
}

function FolderActionModal({
  action,
  name,
  onCancel,
  onConfirm,
}: {
  action: "freeze" | "delete";
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action === "delete";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 text-white shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-start gap-3">
          <div className={`rounded-xl p-3 ${isDelete ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">{isDelete ? "Delete folder forever?" : "Move folder to Cycle Bin?"}</h3>
            <p className="mt-1 text-sm text-gray-400">
              <span className="font-semibold text-amber-300">{name}</span>
              {isDelete ? " and everything inside it will be permanently deleted." : " and everything inside it will move to the Cycle Bin."}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-lg border border-gray-700 px-4 py-2 font-semibold text-gray-300 transition hover:border-gray-500">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition ${isDelete ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"}`}
          >
            {isDelete ? "Delete forever" : "Move to bin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getUploadErrorMessage(error: any) {
  const backendMessage = error?.response?.data?.message;
  if (backendMessage) return backendMessage;
  if (error?.name === "QuotaExceededError" || String(error?.message || "").toLowerCase().includes("quota")) {
    return "Upload failed: these videos are too large for browser storage. Please use the backend upload server or try smaller files.";
  }
  return "Upload failed, please try again";
}

function ToolbarButton({ icon, label, onClick, disabled, primary }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${primary ? "bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 hover:from-amber-400" : "border border-gray-700 bg-gray-800 text-gray-100 hover:border-amber-500/50"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SearchResults({ loading, results, onDelete }: { loading: boolean; results: DriveItem[] | null; onDelete: (id: string) => void }) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <ClipLoader size={50} color="#fbbf24" />
      </div>
    );
  }
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-800 bg-gray-900/80 py-16 text-center">
        <div className="text-7xl text-amber-500">
          <File />
        </div>
        <p className="mt-5 text-2xl font-semibold text-gray-100">No results found</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {results.map((doc) => (
        <DocumentCard key={doc._id} doc={doc as any} onDelete={onDelete} />
      ))}
    </div>
  );
}