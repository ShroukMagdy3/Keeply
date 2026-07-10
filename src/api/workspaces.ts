import api from "./axiosClient";


export interface Workspace {
  _id: string;
  name: string;
  userNID: string;
  createdAt: string;
  itemsCount: number; 
}

export const createWorkspace = async (name: string) => {
  try {
    const { data } = await api.post("/api/v1/workspaces/create", { name });
    return data as { message: string; workspace: Workspace };
  } catch {
  }
};

export const listWorkspaces = async () => {
  try {
    const { data } = await api.get("/api/v1/workspaces/list");
    return data as { message: string; workspaces: Workspace[] };
  } catch {
  }
};

export const getMyWorkspace = async () => {
  try {
    const { data } = await api.get("/api/v1/workspaces/getMyWorkspace");
    return data as { message: string; workspace: Workspace };
  } catch {
  }
};

export const renameWorkspace = async (id: string, name: string) => {
  try {
    const { data } = await api.patch(`/api/v1/workspaces/update/${id}`, { name });
    return data as { message: string; workspace: Workspace };
  } catch {
  }
};

export const deleteWorkspace = async (id: string) => {
  try {
    const { data } = await api.delete(`/api/v1/workspaces/delete/${id}`);
    return data as { message: string; deletedDocuments: number };
  } catch {
  }
};
