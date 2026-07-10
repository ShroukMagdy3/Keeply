import api from "./axiosClient";
import {
  createPersistedWorkspace,
  deletePersistedWorkspace,
  getPersistedWorkspaces,
  updatePersistedWorkspaceName,
} from "../utils/localDriveStorage";

export interface Workspace {
  _id: string;
  name: string;
  userNID: string;
  createdAt: string;
}

export const createWorkspace = async (name: string) => {
  try {
    const { data } = await api.post("/api/v1/workspaces/create", { name });
    return data as { message: string; workspace: Workspace };
  } catch {
    const workspace = createPersistedWorkspace(name);
    return { message: "Saved locally", workspace };
  }
};

export const listWorkspaces = async () => {
  try {
    const { data } = await api.get("/api/v1/workspaces/list");
    return data as { message: string; workspaces: Workspace[] };
  } catch {
    return { message: "Loaded locally", workspaces: getPersistedWorkspaces() };
  }
};

export const getMyWorkspace = async () => {
  try {
    const { data } = await api.get("/api/v1/workspaces/getMyWorkspace");
    return data as { message: string; workspace: Workspace };
  } catch {
    const [workspace] = getPersistedWorkspaces();
    return { message: "Loaded locally", workspace: workspace as Workspace };
  }
};

export const renameWorkspace = async (id: string, name: string) => {
  try {
    const { data } = await api.patch(`/api/v1/workspaces/update/${id}`, { name });
    return data as { message: string; workspace: Workspace };
  } catch {
    updatePersistedWorkspaceName(id, name);
    const workspace = getPersistedWorkspaces().find((entry) => entry._id === id);
    return { message: "Renamed locally", workspace: workspace as Workspace };
  }
};

export const deleteWorkspace = async (id: string) => {
  try {
    const { data } = await api.delete(`/api/v1/workspaces/delete/${id}`);
    return data as { message: string; deletedDocuments: number };
  } catch {
    deletePersistedWorkspace(id);
    return { message: "Deleted locally", deletedDocuments: 0 };
  }
};
