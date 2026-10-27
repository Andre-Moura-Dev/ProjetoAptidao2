import { Categoria, Distancia } from '../dominio/inscricao.regras';

export interface DadosInscricao {
  nomeCompleto: string;
  email: string;
  dataNascimento: string;
  percurso: Distancia;
}

export interface Inscricao extends DadosInscricao {
  idadeNaProva: number;
  categoria: Categoria;
}

export type CampoInscricao = keyof DadosInscricao;

export interface ResultadoOperacao {
  sucesso: boolean;
  mensagem?: string;
  inscricao?: Inscricao;
  erros?: Partial<Record<CampoInscricao, string>>;
}
