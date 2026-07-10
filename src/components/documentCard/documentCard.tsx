import { Download, Trash, Archive, FolderInput, FileText, Image, Video, Music2, File } from "lucide-react";
import React, { useState } from "react";
import { updateDocumentName, deleteDocument, softDeleteDocument } from "../../api/documents";
import toast from "react-hot-toast";

interface Document {
  _id: string;
  name: string;
  type: string;
  secureUrl: string;
  previewUrl: string;
  resourceType: string;
  mimeType?: string;
  createdAt: string;
}

export default function DocumentCard({ doc, onDelete, onMove }: { doc: Document; onDelete?: (id: string) => void; onMove?: (id: string, name: string) => void }) {
  const [name, setName] = useState(doc.name);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const saveName = async () => {
    setEditing(false);
    const nextName = name.trim();
    if (nextName === "") {
      setName(doc.name);
      return;
    }
    if (nextName === doc.name) return;
    setName(nextName);

    try {
      const data = await updateDocumentName(doc._id, nextName);
      if (data.message === "Success") toast.success("Name updated");
    } catch {
      setName(doc.name);
      toast.error("Failed to update name");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") {
      setName(doc.name);
      setEditing(false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(doc.secureUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const typedBlob = doc.mimeType && blob.type !== doc.mimeType ? new Blob([blob], { type: doc.mimeType }) : blob;
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(typedBlob);
        link.download = buildDownloadName(name, doc.name, doc.mimeType, doc.resourceType);
        link.click();
        window.URL.revokeObjectURL(link.href);
      })
      .catch(() => toast.error("Download failed"));
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(doc._id);
      toast.success("Document deleted");
      setShowConfirm(false);
      if (onDelete) onDelete(doc._id);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleFreeze = async () => {
    try {
      await softDeleteDocument(doc._id);
      toast.success("Document moved to Cycle Bin");
      if (onDelete) onDelete(doc._id);
    } catch {
      toast.error("Freeze failed");
    }
  };

  const handleCardClick = () => {
    if (!doc.secureUrl) {
      toast.error("Preview is not available for this file");
      return;
    }

    if (doc.resourceType === "pdf" || doc.mimeType === "application/pdf") {
      openBlobPreview(doc.secureUrl, "application/pdf");
    } else if (["image", "video", "audio", "raw"].includes(doc.resourceType)) {
      window.open(doc.secureUrl, "_blank", "noopener,noreferrer");
    } else {
      toast("Preview not available for this file type");
    }
  };

  const getImageSrc = () => {
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

  const previewIcon = () => {
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

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-80 rounded-2xl bg-gray-800 p-5 text-white shadow-2xl">
            <h3 className="mb-3 text-lg font-semibold">Are you sure?</h3>
            <p className="mb-5 text-sm text-gray-300">
              Do you really want to delete <span className="font-semibold text-amber-300">{name}</span>?
            </p>
            <div className="flex justify-between gap-2">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg bg-gray-600 px-4 py-2 text-sm hover:bg-gray-500">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-amber-600 px-4 py-2 text-sm hover:bg-amber-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 rounded-[24px] border border-white/10 bg-gray-900/80 p-3 shadow-md shadow-black/20 transition hover:-translate-y-0.5 hover:border-amber-500/40 sm:flex-row sm:items-center sm:p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
            <img src={getImageSrc()} alt={name} className="h-full w-full object-cover" onClick={handleCardClick} />
            <div className="absolute bottom-1 right-1 rounded-full bg-gray-950/80 p-1.5 text-amber-400">{previewIcon()}</div>
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={handleKeyDown} className="w-full truncate rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white outline-none" />
            ) : (
              <button className="break-words text-left text-base font-semibold text-amber-400 hover:text-amber-300 [overflow-wrap:anywhere]" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
                {name}
              </button>
            )}
            <p className="mt-1 text-sm text-gray-400">{doc.resourceType?.toUpperCase() || "FILE"}</p>
            <p className="text-sm text-gray-500">Updated {new Date(doc.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button onClick={handleDownload} className="rounded-full p-2 text-gray-200 transition hover:bg-gray-800 hover:text-amber-400" title="Download">
            <Download size={18} />
          </button>
          {onMove && (
            <button onClick={(e) => { e.stopPropagation(); onMove(doc._id, name); }} className="rounded-full p-2 text-gray-200 transition hover:bg-gray-800 hover:text-amber-400" title="Move to...">
              <FolderInput size={18} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleFreeze(); }} className="rounded-full p-2 text-amber-500 transition hover:bg-gray-800 hover:text-amber-400" title="Move to bin">
            <Archive size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="rounded-full p-2 text-red-400 transition hover:bg-gray-800 hover:text-red-300" title="Delete">
            <Trash size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

const hasExtension = (fileName: string) => /\.[^./\\]+$/.test(fileName);

const extensionFromMime = (mimeType?: string, resourceType?: string) => {
  const mimeExtensions: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "text/plain": ".txt",
  };

  if (mimeType && mimeExtensions[mimeType]) return mimeExtensions[mimeType];
  if (resourceType === "pdf") return ".pdf";
  return "";
};

const extensionFromName = (fileName: string) => {
  const match = fileName.match(/(\.[^./\\]+)$/);
  return match?.[1] || "";
};

const buildDownloadName = (currentName: string, originalName: string, mimeType?: string, resourceType?: string) => {
  const cleanName = currentName.trim() || originalName;
  if (hasExtension(cleanName)) return cleanName;
  const extension = extensionFromName(originalName) || extensionFromMime(mimeType, resourceType);
  return `${cleanName}${extension}`;
};

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
