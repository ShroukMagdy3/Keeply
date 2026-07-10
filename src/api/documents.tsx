import axios from "axios";
import api from "./axiosClient";

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
};

export const createFolder = async (name: string, parentId?: string | null, workspaceId?: string | null) => {
  const { data } = await api.post(`${DOCS_URL}/createFolder`, {
    name,
    ...(parentId ? { parentId } : {}),
    ...(workspaceId ? { workspaceId } : {}),
  });
  return data;
};

interface UploadSignature {
  publicId: string;
  folder: string;
  timestamp: number;
  signature: string;
}

interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  signatures: UploadSignature[];
}

const getUploadSignatures = async (count: number): Promise<SignatureResponse> => {
  const { data } = await api.post(`${DOCS_URL}/uploadSignature`, { count });
  return data;
};

const uploadToCloudinaryDirect = async (
  file: File,
  cloudName: string,
  apiKey: string,
  sig: UploadSignature,
  onProgress?: (percent: number) => void
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("public_id", sig.publicId);
  form.append("folder", sig.folder);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    form,
    {
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    }
  );
  return data as {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format?: string;
    bytes?: number;
  };
};

export const uploadFileGeneric = async (
  file: File,
  parentId?: string | null,
  workspaceId?: string | null,
  onStatus?: (status: string) => void
) => {
  try {
    onStatus?.(`Uploading ${file.name}...`);
    const sigData = await getUploadSignatures(1);
    const sig = sigData.signatures[0];
    const result = await uploadToCloudinaryDirect(
      file,
      sigData.cloudName,
      sigData.apiKey,
      sig,
      (percent) => onStatus?.(`Uploading ${file.name}... ${percent}%`)
    );

    onStatus?.("Saving...");
    const { data } = await api.post(`${DOCS_URL}/confirmUpload`, {
      name: file.name,
      ...(parentId ? { parentId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      size: result.bytes,
      mimeType: file.type,
    });

    return data;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
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

  onStatus?.(`Preparing ${totalFiles} files...`);

  try {
    const sigData = await getUploadSignatures(totalFiles);

    let completed = 0;
    const uploaded = await Promise.all(
      fileArray.map(async (file, i) => {
        const result = await uploadToCloudinaryDirect(
          file,
          sigData.cloudName,
          sigData.apiKey,
          sigData.signatures[i]
        );
        completed += 1;
        onStatus?.(
          `Uploading ${totalFiles} files... ${Math.round((completed * 100) / totalFiles)}%`
        );
        return {
          path: (file as any).webkitRelativePath || file.name,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          size: result.bytes,
          mimeType: file.type,
        };
      })
    );

    onStatus?.("Saving...");
    const { data } = await api.post(`${DOCS_URL}/confirmFolderUpload`, {
      ...(parentId ? { parentId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      files: uploaded,
    });

    return data;
  } catch (error) {
    console.error("Folder upload failed:", error);
    throw error;
  }
};

export const moveDocument = async (docId: string, parentId: string | null) => {
  const { data } = await api.patch(`${DOCS_URL}/move/${docId}`, { parentId });
  return data;
};

export const updateDocumentName = async (documentId: string, newName: string) => {
  const { data } = await api.patch(`${DOCS_URL}/update/${documentId}`, { name: newName });
  return data;
};

export const deleteDocument = async (documentId: string) => {
  const { data } = await api.delete(`${DOCS_URL}/delete/${documentId}`);
  return data;
};

export const softDeleteDocument = async (documentId: string) => {
  const { data } = await api.patch(`${DOCS_URL}/freeze/${documentId}`, {});
  return data;
};

export const unfreezeDocument = async (docId: string) => {
  const { data } = await api.patch(`${DOCS_URL}/unfreeze/${docId}`, {});
  return data;
};

export const getAllDocuments = async (workspaceId?: string | null) => {
  const { data } = await api.get(`${DOCS_URL}/getAll`, {
    params: workspaceId ? { workspaceId } : {},
  });
  return { ...data, documents: filterVisibleItems(data.documents || []) };
};

export const getCycleBinDocuments = async (workspaceId?: string | null) => {
  const { data } = await api.get(`${DOCS_URL}/cycleBin`, {
    params: workspaceId ? { workspaceId } : {},
  });
  return data;
};

export const searchDocuments = async (params: { name?: string; type?: string; workspaceId?: string | null }) => {
  const query: Record<string, string> = {};
  if (params.name) query.name = params.name;
  if (params.type) query.type = params.type;
  if (params.workspaceId) query.workspaceId = params.workspaceId;

  const { data } = await api.get(`${DOCS_URL}/search`, { params: query });
  return { ...data, documents: filterVisibleItems(data.documents || []) };
};

const filterVisibleItems = (items: DriveItem[]) =>
  items.filter((item) => !item.deleted && !item.isDeleted && !item.freezed);