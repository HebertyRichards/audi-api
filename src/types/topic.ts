export interface Topic {
    id: number;
    titulo: string;
    conteudo: string;
    autor_id: string;
    categoria: string;
    criado_em: string;
    atualizado_em: string | null;
  }
  
  export interface Comment {
    id: number;
    conteudo: string;
    autor_id: string;
    topico_id: number;
    criado_em: string;
  }
  