const WORKSPACE_KEY = "keeply:workspaces";
const DOCUMENT_KEY = "keeply:documents";

export interface PersistedWorkspace {
  _id: string;
  userNID: string;
  name: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
}

export interface PersistedDriveItem {
  _id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  workspaceId: string;
  secureUrl?: string;
  previewUrl?: string;
  resourceType?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
  deleted?: boolean;
}

const readJSON = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;



export const getPersistedWorkspaces = (): PersistedWorkspace[] => {
  return readJSON<PersistedWorkspace[]>(WORKSPACE_KEY, []);
};

export const savePersistedWorkspaces = (workspaces: PersistedWorkspace[]) => {
  writeJSON(WORKSPACE_KEY, workspaces);
};

export const getPersistedDocuments = (): PersistedDriveItem[] => {
  return readJSON<PersistedDriveItem[]>(DOCUMENT_KEY, []);
};

export const savePersistedDocuments = (documents: PersistedDriveItem[]) => {
  writeJSON(DOCUMENT_KEY, documents);
};

export const createPersistedWorkspace = (name: string, userNID = "local-user"): PersistedWorkspace => {
  const workspace: PersistedWorkspace = {
    _id: createId(),
    name,
    userNID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documents: [],
    itemsCount: 0,
  };
  const workspaces = getPersistedWorkspaces();
  savePersistedWorkspaces([...workspaces, workspace]);
  return workspace;
};

export const deletePersistedWorkspace = (id: string) => {
  const workspaces = getPersistedWorkspaces().filter((w) => w._id !== id);
  const documents = getPersistedDocuments().filter((item) => item.workspaceId !== id);
  savePersistedWorkspaces(workspaces);
  savePersistedDocuments(documents);
};

export const updatePersistedWorkspaceName = (id: string, name: string) => {
  const workspaces = getPersistedWorkspaces().map((w) => (w._id === id ? { ...w, name } : w));
  savePersistedWorkspaces(workspaces);
};

export const readPersistedDocumentsForWorkspace = (workspaceId: string, parentId?: string | null) => {
  const documents = getPersistedDocuments().filter(
    (item) => item.workspaceId === workspaceId && !item.deleted && (parentId === undefined ? true : item.parentId === parentId)
  );
  return documents;
};

export const createPersistedDocument = async (
  workspaceId: string,
  name: string,
  type: "file" | "folder",
  parentId: string | null,
  file?: File
): Promise<PersistedDriveItem> => {
  const documents = getPersistedDocuments();
  let previewUrl = "/images/default.jpg";
  let secureUrl = "/images/default.jpg";
  let resourceType = type === "file" ? "raw" : "folder";
  let mimeType = file?.type;

  if (file) {
    const dataUrl = await fileToDataUrl(file);
    secureUrl = dataUrl;

    const isImage = file.type.startsWith("image/");
    if (isImage) {
      previewUrl = dataUrl;
      resourceType = "image";
    } else if (file.type.includes("pdf")) {
      resourceType = "pdf";
    } else if (file.type.startsWith("video/")) {
      resourceType = "video";
    } else if (file.type.startsWith("audio/")) {
      resourceType = "audio";
    }
  }

  const item: PersistedDriveItem = {
    _id: createId(),
    name,
    type,
    parentId,
    workspaceId,
    secureUrl,
    previewUrl,
    resourceType,
    mimeType,
    size: file?.size,
    createdAt: new Date().toISOString(),
  };
  savePersistedDocuments([...documents, item]);
  return item;
};

export const updatePersistedDocumentName = (id: string, name: string) => {
  const documents = getPersistedDocuments().map((item) => (item._id === id ? { ...item, name } : item));
  savePersistedDocuments(documents);
};

export const softDeletePersistedDocument = (id: string) => {
  const documents = getPersistedDocuments().map((item) => (item._id === id ? { ...item, deleted: true } : item));
  savePersistedDocuments(documents);
};

export const unfreezePersistedDocument = (id: string) => {
  const documents = getPersistedDocuments().map((item) => (item._id === id ? { ...item, deleted: false } : item));
  savePersistedDocuments(documents);
};

export const deletePersistedDocument = (id: string) => {
  const documents = getPersistedDocuments().filter((item) => item._id !== id);
  savePersistedDocuments(documents);
};

export const searchPersistedDocuments = (workspaceId: string, name?: string, type?: string) => {
  const documents = getPersistedDocuments().filter((item) => item.workspaceId === workspaceId && !item.deleted);
  const needle = (name || "").trim().toLowerCase();
  return documents.filter((item) => {
    const matchesName = !needle || item.name.toLowerCase().includes(needle);
    const matchesType = !type || (item.resourceType || "").toLowerCase() === type.toLowerCase();
    return matchesName && matchesType;
  });
};

export const buildBreadcrumb = (workspaceId: string, parentId: string | null) => {
  const items = getPersistedDocuments().filter((item) => item.workspaceId === workspaceId && !item.deleted);
  const breadcrumb: Array<{ id: string; name: string }> = [];
  let currentId = parentId;

  while (currentId) {
    const item = items.find((entry) => entry._id === currentId);
    if (!item) break;
    breadcrumb.unshift({ id: item._id, name: item.name });
    currentId = item.parentId;
  }

  return breadcrumb;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve) => {
    if (typeof FileReader === "undefined") {
      resolve("/images/default.jpg");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "/images/default.jpg");
    reader.readAsDataURL(file);
  });
