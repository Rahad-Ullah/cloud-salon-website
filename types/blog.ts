export interface BlogPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  publishDate: string;
  images?: string[];
  authorName?: string;
  authorImage?: string;
  slug?: string;
  tags?: string[];
}
