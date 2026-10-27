import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscricaoService } from '../../services/inscricao.service';
import { Inscricao } from '../../models/inscricao.model';
import { formatarDataBrasileira, nomeCategoria, nomePercurso } from '../../dominio/inscricao.regras';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-inscricoes-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, DialogModule],
  templateUrl: './inscricoes-lista.component.html',
  styleUrl: './inscricoes-lista.component.scss'
})
export class InscricoesListaComponent {
  readonly inscricoes$ = this.inscricaoService.inscricoes$;
  inscricaoParaCancelar: Inscricao | null = null;
  modalCancelamentoVisivel = false;
  mensagemAcao = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';

  constructor(
    private inscricaoService: InscricaoService
  ) {}

  formatarData = formatarDataBrasileira;
  nomeCategoria = nomeCategoria;
  nomePercurso = nomePercurso;

  solicitarCancelamento(inscricao: Inscricao): void {
    this.inscricaoParaCancelar = inscricao;
    this.modalCancelamentoVisivel = true;
    this.mensagemAcao = '';
  }

  confirmarCancelamento(): void {
    if (!this.inscricaoParaCancelar) {
      return;
    }

    const resultado = this.inscricaoService.cancelar(this.inscricaoParaCancelar.email);
    this.tipoMensagem = resultado.sucesso ? 'sucesso' : 'erro';
    this.mensagemAcao = resultado.mensagem ?? '';
    this.inscricaoParaCancelar = null;
    this.modalCancelamentoVisivel = false;
  }

  fecharModal(): void {
    this.inscricaoParaCancelar = null;
    this.modalCancelamentoVisivel = false;
  }

  alterarVisibilidadeModal(visivel: boolean): void {
    this.modalCancelamentoVisivel = visivel;
    if (!visivel) {
      this.inscricaoParaCancelar = null;
    }
  }
}
