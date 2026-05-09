'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock3, FolderOpen, Lock, Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, EmptyState, ZohalActionMenu, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Folder, Workspace } from '@/types/database';
import { WorkspaceModal } from '@/components/workspace/WorkspaceModal';
import { FolderModal } from '@/components/workspace/FolderModal';
import { cn } from '@/lib/utils';

export default function FolderDetailPage() {
  const params = useParams();
  const folderId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [childFolders, setChildFolders] = useState<Folder[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ kind: 'workspace' | 'folder'; id: string } | null>(null);
  const [activeDropFolderId, setActiveDropFolderId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: folderData } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .is('deleted_at', null)
      .maybeSingle();
    setFolder((folderData as Folder) || null);

    const { data: children } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_id', folderId)
      .is('deleted_at', null)
      .order('name');
    setChildFolders((children as Folder[]) || []);

    const { data: rpcData, error: rpcError } = await supabase.rpc('list_accessible_workspaces');
    if (!rpcError && rpcData) {
      setWorkspaces(
        (rpcData as Workspace[]).filter((workspace) => workspace.parent_folder_id === folderId)
      );
    } else {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('parent_folder_id', folderId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      setWorkspaces((data as Workspace[]) || []);
    }

    setLoading(false);
  }, [folderId, supabase]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const moveWorkspaceToFolder = useCallback(async (workspaceId: string, parentFolderId: string | null) => {
    const { error } = await supabase
      .from('workspaces')
      .update({ parent_folder_id: parentFolderId, updated_at: new Date().toISOString() })
      .eq('id', workspaceId);
    if (!error) {
      setWorkspaces((prev) => prev.filter((workspace) => workspace.id !== workspaceId));
    }
  }, [supabase]);

  const moveFolderToFolder = useCallback(async (childId: string, parentId: string | null) => {
    const { error } = await supabase
      .from('folders')
      .update({ parent_id: parentId, updated_at: new Date().toISOString() })
      .eq('id', childId);
    if (!error) {
      setChildFolders((prev) => prev.filter((folder) => folder.id !== childId));
    }
  }, [supabase]);

  const handleDropOnFolder = useCallback(async (targetFolderId: string) => {
    if (!draggedItem) return;
    if (draggedItem.kind === 'workspace') {
      await moveWorkspaceToFolder(draggedItem.id, targetFolderId);
    } else if (draggedItem.id !== targetFolderId) {
      await moveFolderToFolder(draggedItem.id, targetFolderId);
    }
    setDraggedItem(null);
    setActiveDropFolderId(null);
  }, [draggedItem, moveFolderToFolder, moveWorkspaceToFolder]);

  if (!folder && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<FolderOpen className="h-8 w-8" />}
          title="Folder not found"
          description="The folder you're looking for doesn't exist or you no longer have access."
          action={{ label: 'Back to Workspaces', onClick: () => (window.location.href = '/workspaces') }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <AppHeader
        title={folder?.name || 'Folder'}
        subtitle="Workspaces in this folder"
        leading={
          <Link href="/workspaces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
        actions={
          <ZohalActionMenu
            compact
            ariaLabel="Create"
            icon={<Plus className="h-4 w-4" />}
            label="Create"
            items={[
              {
                label: 'New Workspace',
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setShowCreateWorkspace(true),
              },
              {
                label: 'New Folder',
                icon: <FolderOpen className="h-4 w-4" />,
                onClick: () => setShowCreateFolder(true),
              },
            ]}
          />
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {childFolders.length > 0 && (
              <section className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">Folders</div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {childFolders.map((child) => (
                    <Link
                      key={child.id}
                      href={`/workspaces/folders/${child.id}`}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedItem({ kind: 'folder', id: child.id });
                      }}
                      onDragEnd={() => {
                        setDraggedItem(null);
                        setActiveDropFolderId(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnter={() => setActiveDropFolderId(child.id)}
                      onDragLeave={() => setActiveDropFolderId((current) => (current === child.id ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault();
                        void handleDropOnFolder(child.id);
                      }}
                      className={cn(
                        'group flex min-h-[128px] flex-col justify-between rounded-[12px] border border-border bg-surface p-4 text-left transition-colors duration-150',
                        'hover:border-[color:var(--border-strong)] hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent/30',
                        activeDropFolderId === child.id && 'border-accent/45 bg-surface-alt ring-2 ring-accent/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-warning/10 text-warning">
                          <FolderOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold leading-snug text-text">{child.name}</div>
                          <div className="mt-1 text-xs text-text-muted">Folder</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-soft">
                        <FolderOpen className="h-3 w-3" />
                        Open collection
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">Workspaces</div>
              {workspaces.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" />}
                  title="No workspaces in this folder"
                  description="Create a workspace in this folder to get started."
                  action={{ label: 'New Workspace', onClick: () => setShowCreateWorkspace(true) }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {workspaces.map((workspace) => {
                    const accentColor = workspace.color ? String(workspace.color) : 'var(--accent)';
                    const initial = workspace.name.charAt(0).toUpperCase();
                    const cm = (pct: number) => `color-mix(in srgb, ${accentColor} ${pct}%, transparent)`;
                    const isReadOnly = !['owner', 'editor', undefined, null, ''].includes((workspace as Workspace & { access_role?: string | null }).access_role);
                    return (
                      <Link
                        key={workspace.id}
                        href={`/workspaces/${workspace.id}?fromFolder=${encodeURIComponent(folderId)}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggedItem({ kind: 'workspace', id: workspace.id });
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        className="flex min-h-[148px] flex-col rounded-[12px] border border-border bg-surface p-4 text-left transition-colors duration-150 hover:border-[color:var(--border-strong)] hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-sm font-bold"
                            style={{ background: cm(11), color: accentColor, border: `1px solid ${cm(28)}` }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-sm font-semibold leading-snug text-text">{workspace.name}</div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">
                              {workspace.description || 'Workspace'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                          <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-text-soft">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
                            <span className="truncate">{workspace.workspace_type}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-[11px] text-text-muted">
                            {isReadOnly ? <Lock className="h-3 w-3" /> : null}
                            <Clock3 className="h-3 w-3" />
                            <span>
                              {new Date(workspace.updated_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showCreateWorkspace && (
        <WorkspaceModal
          initialParentFolderId={folderId}
          onClose={() => setShowCreateWorkspace(false)}
          onSaved={() => {
            setShowCreateWorkspace(false);
            void fetchData();
          }}
        />
      )}

      {showCreateFolder && (
        <FolderModal
          title="New Folder"
          initialParentId={folderId}
          initialOrgId={folder?.org_id || null}
          onClose={() => setShowCreateFolder(false)}
          onSaved={() => {
            setShowCreateFolder(false);
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
