import { ArchiveRestore, File, FileText, Image, Info, Music2, RefreshCw, Trash2, Video } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteDocument, getCycleBinDocuments, unfreezeDocument } from "../../api/documents";
import { ClipLoader } from "react-spinners";

interface Document {
  _id: string;
  name: string;
  type: string;
  secureUrl: string;
  previewUrl: string;
  resourceType: string;
  createdAt?: string;
  deletedAt?: string;
}

const LAST_WORKSPACE_KEY = "lastWorkspaceId";

export default function CycleBin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const fetchCycleBin = async () => {
    setLoading(true);
    try {
      // Scope to whichever workspace the user last had open on the Workspace
      // page; if none is remembered yet, the backend falls back to their
      // default (oldest) workspace.
      const workspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
      const data = await getCycleBinDocuments(workspaceId);
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cycle bin");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async (docId: string) => {
    try {
      await unfreezeDocument(docId);
      toast.success("Document restored!");
      setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
    } catch (err) {
      toast.error("Failed to restore document");
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget._id);
      toast.success("Deleted forever");
      setDocuments((prev) => prev.filter((doc) => doc._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleOpen = (doc: Document) => {
    if (!doc.secureUrl) {
      toast.error("Preview is not available for this file");
      return;
    }

    if (doc.resourceType === "pdf") {
      openBlobPreview(doc.secureUrl, "application/pdf");
    } else if (["image", "video", "audio", "raw"].includes(doc.resourceType)) {
      window.open(doc.secureUrl, "_blank", "noopener,noreferrer");
    } else {
      toast("Preview not available");
    }
  };

  const getImageSrc = (doc: Document) => {
    switch (doc.resourceType) {
      case "image":
        return doc.secureUrl;
      case "video":
        return doc.previewUrl || "/images/video.jpg";
      case "audio":
        return "/images/R.jpeg";
      case "pdf":
        return doc.previewUrl || "/images/default.jpg";
      default:
        return doc.previewUrl || "/images/default.jpg";
    }
  };

  const getTypeIcon = (doc: Document) => {
    switch (doc.resourceType) {
      case "image":
        return <Image size={18} />;
      case "video":
        return <Video size={18} />;
      case "audio":
        return <Music2 size={18} />;
      case "pdf":
        return <FileText size={18} />;
      default:
        return <File size={18} />;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Recently";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Recently";
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchCycleBin();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center bg-gray-950">
        <ClipLoader size={50} color="#fbbf24" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-lg shadow-black/20 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300">
                <Trash2 size={15} /> Recovery area
              </div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Cycle Bin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Files and folders moved here are hidden from your workspace. Review them, preview what you need, and restore anything that should return to your drive.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="rounded-xl border border-white/10 bg-gray-950 px-4 py-3">
                <p className="text-xs uppercase text-gray-500">Recoverable items</p>
                <p className="mt-1 text-2xl font-semibold text-amber-400">{documents.length}</p>
              </div>
              <button
                onClick={fetchCycleBin}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-amber-500/60 hover:text-amber-300"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <Info size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p>
            Restoring an item moves it back into its original workspace location when possible. If a preview is available, click the thumbnail or file name before restoring.
          </p>
        </div>

        {documents.length === 0 ? (
          <section className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900 p-8 text-center">
            <div className="rounded-2xl bg-gray-800 p-5 text-amber-400">
              <Trash2 size={48} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Cycle Bin is empty</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
              Nothing is waiting for recovery. Deleted workspace items will appear here so you can restore them later.
            </p>
          </section>
        ) : (
          <section className="grid gap-3">
            {documents.map((doc) => (
              <article
                key={doc._id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gray-900 p-4 shadow-md shadow-black/20 transition hover:border-amber-500/40 sm:flex-row sm:items-center"
              >
                <button
                  onClick={() => handleOpen(doc)}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-gray-800"
                  title="Preview"
                >
                  <img src={getImageSrc(doc)} alt={doc.name} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 rounded-full bg-gray-950/85 p-1.5 text-amber-400">
                    {getTypeIcon(doc)}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => handleOpen(doc)}
                    className="break-words text-left text-base font-semibold text-amber-300 transition hover:text-amber-200 [overflow-wrap:anywhere]"
                  >
                    {doc.name}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="rounded-full bg-gray-800 px-3 py-1">
                      {doc.resourceType?.toUpperCase() || "FILE"}
                    </span>
                    <span className="rounded-full bg-gray-800 px-3 py-1">
                      Removed {formatDate(doc.deletedAt || doc.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-amber-400"
                    onClick={() => handleUnfreeze(doc._id)}
                    title="Restore"
                  >
                    <ArchiveRestore size={16} />
                    Restore
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10"
                    onClick={() => setDeleteTarget(doc)}
                    title="Delete forever"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {deleteTarget && (
        <DeleteCycleBinModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handlePermanentDelete}
        />
      )}
    </div>
  );
}

function DeleteCycleBinModal({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 text-white shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
            <Trash2 size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">Delete forever?</h3>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              <span className="font-semibold text-amber-300">{name}</span> will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-lg border border-gray-700 px-4 py-2 font-semibold text-gray-300 transition hover:border-gray-500">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500">
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

const openBlobPreview = (url: string, mimeType: string) => {
  const previewWindow = window.open("", "_blank", "noopener,noreferrer");
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Preview failed");
      return res.blob();
    })
    .then((blob) => {
      const typedBlob = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
      const objectUrl = window.URL.createObjectURL(typedBlob);
      if (previewWindow) {
        previewWindow.location.href = objectUrl;
      } else {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
    })
    .catch(() => {
      if (previewWindow) previewWindow.close();
      window.open(url, "_blank", "noopener,noreferrer");
    });
};
