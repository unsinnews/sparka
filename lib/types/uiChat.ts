export interface UIChat {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
  userId: string;
  isPinned: boolean;
}
