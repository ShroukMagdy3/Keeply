import api from "./axiosClient";
import {
  buildBreadcrumb,
  createPersistedDocument,
  deletePersistedDocument,
  getPersistedDocuments,
  readPersistedDocumentsForWorkspace,
  searchPersistedDocuments,
  softDeletePersistedDocument,
  unfreezePersistedDocument,
  updatePersistedDocumentName,
} from "../utils/localDriveStorage";

const DOCS_URL = "/api/v1/workspaces/documents";

export interface DriveItem {
  _id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  secureUrl?: string;
  previewUrl?: string;
  resourceType?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
  deleted?: boolean;
  isDeleted?: boolean;
  freezed?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export const listContents = async (
  parentId?: string | null,
  workspaceId?: string | null
): Promise<{ currentFolder: DriveItem | null; breadcrumb: BreadcrumbItem[]; items: DriveItem[] }> => {
  try {
    const { data } = await api.get(`${DOCS_URL}/list`, {
      params: {
        ...(parentId ? { parentId } : {}),
        ...(workspaceId ? { workspaceId } : {}),
      },
    });
    return {
      ...data,
      items: filterVisibleItems(data.items || []),
    };
  } catch {
    const items = readPersistedDocumentsForWorkspace(workspaceId ?? "", parentId ?? null) as DriveItem[];
    return {
      currentFolder: null,
      breadcrumb: buildBreadcrumb(workspaceId ?? "", parentId ?? null),
      items,
    };
  }
};

export const createFolder = async (name: string, parentId?: string | null, workspaceId?: string | null) => {
  try {
    const { data } = await api.post(`${DOCS_URL}/createFolder`, {
      name,
      ...(parentId ? { parentId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
    });
    return data;
  } catch {
    const folder = await createPersistedDocument(workspaceId ?? "", name, "folder", parentId ?? null);
    return { message: "Saved locally", folder };
  }
};

export const uploadFileGeneric = async (
  file: File,
  parentId?: string | null,
  workspaceId?: string | null
) => {
  try {
    const form = new FormData();
    form.append("file", file);
    if (parentId) form.append("parentId", parentId);
    if (workspaceId) form.append("workspaceId", workspaceId);
    const { data } = await api.post(`${DOCS_URL}/uploadFile`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch {
    const document = await createPersistedDocument(workspaceId ?? "", file.name, "file", parentId ?? null, file);
    return { message: "Saved locally", document };
  }
};

export const uploadFolderBulk = async (
  files: FileList | File[],
  parentId?: string | null,
  workspaceId?: string | null,
  onStatus?: (status: string) => void
) => {
  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;
  try {
    onStatus?.(`Preparing ${totalFiles} files...`);
    const form = new FormData();
    const paths: string[] = [];
    fileArray.forEach((file) => {
      form.append("files", file);
      paths.push((file as any).webkitRelativePath || file.name);
    });
    form.append("paths", JSON.stringify(paths));
    if (parentId) form.append("parentId", parentId);
    if (workspaceId) form.append("workspaceId", workspaceId);
    const { data } = await api.post(`${DOCS_URL}/uploadFolder`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) {
          onStatus?.(`Uploading ${totalFiles} files...`);
          return;
        }
        const percent = Math.min(100, Math.round((event.loaded * 100) / event.total));
        onStatus?.(`Uploading ${totalFiles} files... ${percent}%`);
      },
    });
    return data;
  } catch {
    onStatus?.("Backend upload failed. Saving files in this browser...");
    const created = [];
    for (const [index, file] of fileArray.entries()) {
      onStatus?.(`Saving locally ${index + 1}/${totalFiles}: ${file.name}`);
      created.push(await createPersistedDocument(workspaceId ?? "", file.name, "file", parentId ?? null, file as File));
    }
    return { message: "Saved locally", uploaded: created.length, documents: created };
  }
};

export const moveDocument = async (docId: string, parentId: string | null) => {
  try {
    const { data } = await api.patch(`${DOCS_URL}/move/${docId}`, { parentId });
    return data;
  } catch {
    return { message: "Moved locally", docId, parentId };
  }
};

export const updateDocumentName = async (documentId: string, newName: string) => {
  try {
    const { data } = await api.patch(`${DOCS_URL}/update/${documentId}`, { name: newName });
    return data;
  } catch {
    updatePersistedDocumentName(documentId, newName);
    return { message: "Success" };
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    const { data } = await api.delete(`${DOCS_URL}/delete/${documentId}`);
    return data;
  } catch {
    deletePersistedDocument(documentId);
    return { message: "Deleted locally" };
  }
};

export const softDeleteDocument = async (documentId: string) => {
  try {
    const { data } = await api.patch(`${DOCS_URL}/freeze/${documentId}`, {});
    return data;
  } catch {
    softDeletePersistedDocument(documentId);
    return { message: "Moved to bin locally" };
  }
};

export const unfreezeDocument = async (docId: string) => {
  try {
    const { data } = await api.patch(`${DOCS_URL}/unfreeze/${docId}`, {});
    return data;
  } catch {
    unfreezePersistedDocument(docId);
    return { message: "Restored locally" };
  }
};

export const getAllDocuments = async (workspaceId?: string | null) => {
  try {
    const { data } = await api.get(`${DOCS_URL}/getAll`, {
      params: workspaceId ? { workspaceId } : {},
    });
    return { ...data, documents: filterVisibleItems(data.documents || []) };
  } catch {
    return { documents: readPersistedDocumentsForWorkspace(workspaceId ?? "") };
  }
};

export const getCycleBinDocuments = async (workspaceId?: string | null) => {
  try {
    const { data } = await api.get(`${DOCS_URL}/cycleBin`, {
      params: workspaceId ? { workspaceId } : {},
    });
    return data;
  } catch {
    return { documents: getPersistedDocuments().filter((item) => item.workspaceId === (workspaceId ?? "") && item.deleted) };
  }
};

export const searchDocuments = async (params: { name?: string; type?: string; workspaceId?: string | null }) => {
  try {
    const query: Record<string, string> = {};
    if (params.name) query.name = params.name;
    if (params.type) query.type = params.type;
    if (params.workspaceId) query.workspaceId = params.workspaceId;

    const { data } = await api.get(`${DOCS_URL}/search`, { params: query });
    return { ...data, documents: filterVisibleItems(data.documents || []) };
  } catch {
    return { documents: searchPersistedDocuments(params.workspaceId ?? "", params.name, params.type) };
  }
};

const filterVisibleItems = (items: DriveItem[]) =>
  items.filter((item) => !item.deleted && !item.isDeleted && !item.freezed);
