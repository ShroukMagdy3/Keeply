import { useEffect, useState } from "react";
import WorkspaceHeader from "../workspaceHeader/workspaceHeader";
import DocumentList from "../documents/documentlist";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";
import { Plus, Trash2, Briefcase, FolderOpen, Sparkles } from "lucide-react";
import {
  listWorkspaces,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  type Workspace,
} from "../../api/workspaces";
import { getPersistedDocuments } from "../../utils/localDriveStorage";

const LAST_WORKSPACE_KEY = "lastWorkspaceId";

export default function WorkspaceProfile() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const loadWorkspaces = async (preferId?: string | null) => {
    setLoading(true);
    try {
      const data = await listWorkspaces();
      setWorkspaces(data.workspaces);

      const remembered = preferId || localStorage.getItem(LAST_WORKSPACE_KEY);
      const stillExists = data.workspaces.find((w) => w._id === remembered);
      const next = stillExists ? remembered! : data.workspaces[0]?._id ?? null;

      setSelectedId(next);
      if (next) localStorage.setItem(LAST_WORKSPACE_KEY, next);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load your workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    localStorage.setItem(LAST_WORKSPACE_KEY, id);
  };

  const openCreateModal = () => {
    setWorkspaceName("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreateModal(false);
    setWorkspaceName("");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const data = await createWorkspace(name);
      toast.success(`"${data.workspace.name}" created`);
      setShowCreateModal(false);
      setWorkspaceName("");
      await loadWorkspaces(data.workspace._id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't create that workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (newName: string) => {
    if (!selectedId) return;
    try {
      await renameWorkspace(selectedId, newName);
      setWorkspaces((prev) => prev.map((w) => (w._id === selectedId ? { ...w, name: newName } : w)));
      toast.success("Name updated");
    } catch {
      toast.error("Please try again in a moment");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const current = workspaces.find((w) => w._id === selectedId);
    if (!current) return;
    if (workspaces.length === 1) {
      toast.error("You need at least one workspace");
      return;
    }
    if (!window.confirm(`Permanently delete "${current.name}" and everything inside it? This can't be undone.`)) return;
    try {
      await deleteWorkspace(selectedId);
      toast.success(`"${current.name}" deleted`);
      localStorage.removeItem(LAST_WORKSPACE_KEY);
      await loadWorkspaces();
    } catch {
      toast.error("Couldn't delete that workspace");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <ClipLoader size={50} color="#fbbf24" />
      </div>
    );
  }

  const current = workspaces.find((w) => w._id === selectedId);
  const documents = getPersistedDocuments().filter((item) => !item.deleted);
  const getWorkspaceCount = (workspaceId: string) => documents.filter((item) => item.workspaceId === workspaceId).length;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-lg shadow-black/20 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
                <Sparkles size={15} /> workspace
              </div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Your cloud hub</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                Create workspaces, organize documents, and keep everything synced to your browser for a responsive experience on every device.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button
                onClick={openCreateModal}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                <Plus size={16} /> New workspace
              </button>
              {workspaces.length > 1 && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-red-400 transition hover:border-red-500/60 hover:text-red-300"
                  title="Delete this workspace"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => {
            const isSelected = workspace._id === selectedId;
            return (
              <button
                key={workspace._id}
                onClick={() => handleSelect(workspace._id)}
                className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10" : "border-white/10 bg-gray-900 hover:border-amber-500/40 hover:bg-gray-800/80"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-gray-800 p-3 text-amber-400">
                    <Briefcase size={20} />
                  </div>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">{new Date(workspace.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="mt-4 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">{workspace.name}</h2>
                <p className="mt-1 text-sm text-gray-400">{getWorkspaceCount(workspace._id)} items stored in this workspace</p>
              </button>
            );
          })}
        </section>

        {current && (
          <div className="space-y-4">
            <WorkspaceHeader workspaceName={current.name} createdAt={current.createdAt} onUpdate={handleRename} />
            <div className="rounded-2xl border border-white/10 bg-gray-900 p-3 sm:p-4">
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                <FolderOpen size={16} className="text-amber-400" />
                <span>Open the workspace area below to browse folders, upload files, and manage your documents.</span>
              </div>
              {selectedId && <DocumentList workspaceId={selectedId} />}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 text-left shadow-2xl shadow-black/40">
            <div className="mb-5">
              <div className="mb-3 inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-400">
                <Briefcase size={22} />
              </div>
              <h2 className="text-xl font-semibold text-white">Create workspace</h2>
              <p className="mt-1 text-sm text-gray-400">Give your new workspace a clear name.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="workspace-name" className="mb-2 block text-sm font-medium text-gray-300">
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  autoFocus
                  placeholder="New workspace"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-lg border border-gray-700 px-4 py-2 font-semibold text-gray-300 transition hover:border-gray-500 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !workspaceName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-gray-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} />
                  {creating ? "Creating..." : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
