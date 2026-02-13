export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}
