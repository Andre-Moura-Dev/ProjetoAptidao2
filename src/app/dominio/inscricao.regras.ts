export const DATA_PROVA = '2027-03-14';

export type Distancia = 'KM_5' | 'KM_10';
export type Categoria = 'JUVENIL' | 'ADULTO' | 'MASTER' | 'SENIOR';
export type ErroRegulamento = 'IDADE_MINIMA' | 'DISTANCIA_NAO_PERMITIDA';

export interface AvaliacaoInscricao {
  aceita: boolean;
  idadeNaProva: number;
  categoria: Categoria | null;
  erro: ErroRegulamento | null;
}

// Normalização de Email: remove espaços nas pontas e usa minúsculas.
export function normalizarEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}

// Calcula a idade completa na data de referência, sem depender fuso horário
export function calcularIdade(nascimento: string, referencia: string): number {
  const [anoNasc, mesNasc, diaNasc] = nascimento.split('-').map(Number);
  const [anoRef, mesRef, diaRef] = referencia.split('-').map(Number);

  let idade = anoRef - anoNasc;
  const aindaNaoFezAniversario =
    mesRef < mesNasc || (mesRef === mesNasc && diaRef < diaNasc);

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  return idade;
}

// Verifica Idade Mínima e aplica regra dos 10 km
export function avaliarInscricao(
  nascimento: string,
  distancia: Distancia,
  dataProva: string
): AvaliacaoInscricao {
  const idadeNaProva = calcularIdade(nascimento, dataProva);

  if (idadeNaProva < 14) {
    return {
      aceita: false,
      idadeNaProva,
      categoria: null,
      erro: 'IDADE_MINIMA'
    };
  }

  if (distancia === 'KM_10' && idadeNaProva < 18) {
    return {
      aceita: false,
      idadeNaProva,
      categoria: null,
      erro: 'DISTANCIA_NAO_PERMITIDA'
    };
  }

  let categoria: Categoria;

  if (idadeNaProva <= 17) {
    categoria = 'JUVENIL'
  } else if (idadeNaProva <= 39) {
    categoria = 'ADULTO'
  } else if (idadeNaProva <= 59) {
    categoria = 'MASTER';
  } else {
    categoria = 'SENIOR';
  }

  return {
    aceita: true,
    idadeNaProva,
    categoria,
    erro: null
  };
}

// Retorna true apenas para datas ISO reais, sem correção automática de datas inválidas
export function dataIsoValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);
  const date = new Date(ano, mes - 1, dia);

  return date.getFullYear() === ano &&
    date.getMonth() === mes - 1 &&
    date.getDate() === dia;
}

/** Data local no formato ISO; evita o deslocamento que pode ocorrer com toISOString(). */
export function dataLocalHoje(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function normalizarNome(nome: string): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ');
}

export function formatarDataBrasileira(data: string): string {
  if (!dataIsoValida(data)) {
    return data || '—';
  }
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataProva(data: string): string {
  if (!dataIsoValida(data)) {
    return data;
  }
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function nomeCategoria(categoria: Categoria): string {
  const nomes: Record<Categoria, string> = {
    JUVENIL: 'Juvenil',
    ADULTO: 'Adulto',
    MASTER: 'Master',
    SENIOR: 'Sênior'
  };
  return nomes[categoria];
}

export function nomePercurso(percurso: Distancia): string {
  return percurso === 'KM_5' ? '5 km' : '10 km';
}
