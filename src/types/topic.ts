export interface Topic {
    id: number;
    title: string;
    content: string;
    author_id: string;
    category: string;
    created_in: string;
    updated_in: string | null;
    slug: string;
  }
  
  export interface Comment {
    id: number;
    content: string;
    author_id: string;
    topic_id: number;
    created_in: string;
    updated_in: string | null;
  }
  
  export interface Category {
    slug: string;
    name: string;
  }
  