export interface Topic {
    id: number;
    title: string;
    content: string;
    author_id: string;
    category: string;
    created: string;
    update: string | null;
    slug: string;
  }
  
  export interface Comment {
    id: number;
    content: string;
    author_id: string;
    topico_id: number;
    created: string;
  }
  