import { afterNextRender, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  DATA_PROVA,
  avaliarInscricao,
  dataIsoValida,
  dataLocalHoje,
  formatarDataBrasileira,
  normalizarEmail,
  normalizarNome
} from '../dominio/inscricao.regras'
import {
  CampoInscricao,
  DadosInscricao,
  Inscricao,
  ResultadoOperacao
} from '../models/inscricao.model';

const CHAVE_STORAGE = 'corrida.inscricoes.v1';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({
  providedIn: 'root'
})
export class InscricaoService {
  private inscricoes: Inscricao[] = [];
  private readonly ambienteBrowser: boolean;

  readonly inscricoes$ = new BehaviorSubject<Inscricao[]>([]);
  readonly avisoPersistencia$ = new BehaviorSubject<string | null>(null);
  readonly carregamentoConcluido$ = new BehaviorSubject(false);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.ambienteBrowser = isPlatformBrowser(platformId);
    if (this.ambienteBrowser) {
      afterNextRender(() => this.carregarDoStorage());
    }
  }

  listarTodas(): Inscricao[] {
    return this.inscricoes.map(inscricao => ({ ...inscricao }));
  }

  obterEmail(email: string): Inscricao | undefined {
    const emailNormalizado = normalizarEmail(email);
    const inscricao = this.inscricoes.find(item => item.email === emailNormalizado);
    return inscricao ? { ...inscricao } : undefined;
  }

  cadastrar(dados: DadosInscricao): ResultadoOperacao {
    const dadosNormalizados = this.normalizarDados(dados);
    const erros = this.validarDados(dadosNormalizados);

    if (this.inscricoes.some(item => item.email === dadosNormalizados.email)) {
      erros.email = 'Já existe uma inscrição ativa com este e-mail.';
    }

    if (Object.keys(erros).length > 0) {
      return {
        sucesso: false,
        mensagem: 'Confira os campos destacados.',
        erros
      };
    }

    const avaliacao = avaliarInscricao(
      dadosNormalizados.dataNascimento,
      dadosNormalizados.percurso,
      DATA_PROVA
    );

    if (!avaliacao.aceita || !avaliacao.categoria) {
      return this.recusaRegulamento(avaliacao.erro);
    }

    const novaInscricao: Inscricao = {
      ...dadosNormalizados,
      idadeNaProva: avaliacao.idadeNaProva,
      categoria: avaliacao.categoria
    };

    this.inscricoes = [ ...this.inscricoes, novaInscricao ];
    this.publicarEGravar();

    return {
      sucesso: true,
      mensagem: 'Inscrição cadastrada com sucesso.',
      inscricao: { ...novaInscricao }
    };
  }

  editar(emailOriginal: string, dados: DadosInscricao): ResultadoOperacao {
    const emailIdentificador = normalizarEmail(emailOriginal);
    const indice = this.inscricoes.findIndex(item => item.email === emailIdentificador);

    if (indice < 0) {
      return { sucesso: false, mensagem: 'Inscrição não encontrada. Ela pode ter sido cancelada.' };
    }

    const atual = this.inscricoes[indice];
    // O e-mail nunca é atualizado pela edição: o identificador atual prevalece.
    const dadosNormalizados: DadosInscricao = {
      ...this.normalizarDados(dados),
      email: atual.email
    };
    const erros = this.validarDados(dadosNormalizados);

    if (this.inscricoes.some(item => item.email === dadosNormalizados.email && item.email !== atual.email)) {
      erros.email = 'Já existe uma inscrição ativa com este e-mail.';
    }

    if (Object.keys(erros).length > 0) {
      return { sucesso: false, mensagem: 'Não foi possível salvar as alterações. Confira os campos.', erros };
    }

    const avaliacao = avaliarInscricao(
      dadosNormalizados.dataNascimento,
      dadosNormalizados.percurso,
      DATA_PROVA
    );

    if (!avaliacao.aceita || !avaliacao.categoria) {
      return this.recusaRegulamento(avaliacao.erro);
    }

    const inscricaoAtualizada: Inscricao = {
      ...dadosNormalizados,
      idadeNaProva: avaliacao.idadeNaProva,
      categoria: avaliacao.categoria
    };

    const novaLista = [...this.inscricoes];
    novaLista[indice] = inscricaoAtualizada;
    this.inscricoes = novaLista;
    this.publicarEGravar();

    return {
      sucesso: true,
      mensagem: 'Inscrição atualizada com sucesso.',
      inscricao: { ...inscricaoAtualizada }
    };
  }

  cancelar(email: string): ResultadoOperacao {
    const emailNormalizado = normalizarEmail(email);
    const existe = this.inscricoes.some(item => item.email === emailNormalizado);

    if (!existe) {
      return { sucesso: false, mensagem: 'Nenhuma inscrição ativa foi encontrada para este e-mail.' };
    }

    this.inscricoes = this.inscricoes.filter(item => item.email !== emailNormalizado);
    this.publicarEGravar();
    return { sucesso: true, mensagem: 'Inscrição cancelada. O e-mail está liberado para um novo cadastro.' };
  }

  limparAvisoPersistencia(): void {
    this.avisoPersistencia$.next(null);
  }

  normalizarDados(dados: DadosInscricao): DadosInscricao {
    return {
      nomeCompleto: normalizarNome(dados?.nomeCompleto ?? ''),
      email: normalizarEmail(dados?.email ?? ''),
      dataNascimento: (dados?.dataNascimento ?? '').trim(),
      percurso: dados?.percurso
    };
  }

  private validarDados(dados: DadosInscricao): Partial<Record<CampoInscricao, string>> {
    const erros: Partial<Record<CampoInscricao, string>> = {};

    if (dados.nomeCompleto.length < 3 || dados.nomeCompleto.length > 100) {
      erros.nomeCompleto = 'Informe de 3 a 100 caracteres no nome, após normalizar os espaços.';
    }

    if (!dados.email) {
      erros.email = 'O e-mail é obrigatório.';
    } else if (!EMAIL_VALIDO.test(dados.email)) {
      erros.email = 'Informe um e-mail válido.';
    }

    if (!dados.dataNascimento) {
      erros.dataNascimento = 'A data de nascimento é obrigatória.';
    } else if (!dataIsoValida(dados.dataNascimento)) {
      erros.dataNascimento = 'Informe uma data de nascimento válida.';
    } else if (dados.dataNascimento >= dataLocalHoje()) {
      erros.dataNascimento = 'A data de nascimento deve ser anterior a hoje.';
    }

    if (dados.percurso !== 'KM_5' && dados.percurso !== 'KM_10') {
      erros.percurso = 'Selecione um percurso válido.';
    }

    return erros;
  }

  private recusaRegulamento(erro: 'IDADE_MINIMA' | 'DISTANCIA_NAO_PERMITIDA' | null): ResultadoOperacao {
    if (erro === 'IDADE_MINIMA') {
      return {
        sucesso: false,
        mensagem: 'Inscrição recusada pelo regulamento: a idade mínima na data da prova é 14 anos.',
        erros: { dataNascimento: `A pessoa terá menos de 14 anos na data da prova (${formatarDataBrasileira(DATA_PROVA)}).` }
      };
    }

    if (erro === 'DISTANCIA_NAO_PERMITIDA') {
      return {
        sucesso: false,
        mensagem: 'Inscrição recusada pelo regulamento: o percurso de 10 km é permitido somente a partir dos 18 anos.',
        erros: { percurso: 'Para participantes de 14 a 17 anos, selecione o percurso de 5 km.' }
      };
    }

    return { sucesso: false, mensagem: 'A inscrição não atende ao regulamento da prova.' };
  }

  private carregarDoStorage(): void {
    try {

      const conteudo = localStorage.getItem(CHAVE_STORAGE);
      if (!conteudo) {
        this.inscricoes = [];
        this.inscricoes$.next([]);
        this.carregamentoConcluido$.next(true);
        return;
      }

      const dados: unknown = JSON.parse(conteudo);
      if (!Array.isArray(dados)) {
        this.avisarDadosCorrompidos();
        return;
      }

      const reconstruidas: Inscricao[] = [];
      const emails = new Set<string>();

      for (const item of dados) {
        if (!this.registroPersistidoValido(item)) {
          this.avisarDadosCorrompidos();
          return;
        }

        const entrada = this.normalizarDados(item);
        const erros = this.validarDados(entrada);
        const avaliacao = avaliarInscricao(entrada.dataNascimento, entrada.percurso, DATA_PROVA);

        if (Object.keys(erros).length > 0 || emails.has(entrada.email) || !avaliacao.aceita || !avaliacao.categoria) {
          this.avisarDadosCorrompidos();
          return;
        }

        emails.add(entrada.email);

        reconstruidas.push({
          ...entrada,
          idadeNaProva: avaliacao.idadeNaProva,
          categoria: avaliacao.categoria
        });
      }

      this.inscricoes = reconstruidas;
      this.inscricoes$.next(this.listarTodas());
      this.carregamentoConcluido$.next(true);
    } catch {
      this.avisarDadosCorrompidos('Não foi possível ler os dados salvos. A aplicação continua utilizável, mas a lista começou vazia.')
    }
  }

  private registroPersistidoValido(item: unknown): item is DadosInscricao {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const registro = item as Partial<DadosInscricao>;
    return typeof registro.nomeCompleto === 'string' &&
      typeof registro.email === 'string' &&
      typeof registro.dataNascimento === 'string' &&
      (registro.percurso === 'KM_5' || registro.percurso === 'KM_10');
  }

  private avisarDadosCorrompidos(mensagem = 'Os dados salvos estavam corrompidos ou em formato inesperado. A lista foi aberta vazia; ao salvar, o armazenamento será regravado.'): void {
    this.inscricoes = [];
    this.inscricoes$.next([]);
    this.avisoPersistencia$.next(mensagem);
    this.carregamentoConcluido$.next(true);
  }

  private publicarEGravar(): void {
    this.inscricoes$.next(this.listarTodas());

    if (!this.ambienteBrowser) {
      return;
    }

    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.inscricoes));
      this.avisoPersistencia$.next(null);
    } catch {
      this.avisoPersistencia$.next(
        'Não foi possível salvar no armazenamento do navegador. As alterações continuam visíveis nesta sessão, mas podem não permanecer após recarregar a página.'
      )
    }
  }
}
