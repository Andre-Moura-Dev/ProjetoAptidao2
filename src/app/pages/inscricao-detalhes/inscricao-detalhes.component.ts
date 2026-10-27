import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Inscricao } from '../../models/inscricao.model';
import {
  formatarDataBrasileira,
  nomeCategoria,
  nomePercurso,
  normalizarEmail
} from '../../dominio/inscricao.regras'
import { InscricaoService } from '../../services/inscricao.service';
import { ButtonModule } from 'primeng/button';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-inscricao-detalhes',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './inscricao-detalhes.component.html',
  styleUrl: './inscricao-detalhes.component.scss'
})
export class InscricaoDetalhesComponent implements OnInit {
  inscricao?: Inscricao;
  carregando = true;
  formatarData = formatarDataBrasileira;
  nomeCategoria = nomeCategoria;
  nomePercurso = nomePercurso;

  constructor(
    private route: ActivatedRoute,
    private inscricaoService: InscricaoService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.inscricaoService.inscricoes$,
      this.inscricaoService.carregamentoConcluido$
    ]).subscribe(([params, , carregamentoConcluido]) => {
      this.carregando = !carregamentoConcluido;
      if (!carregamentoConcluido) {
        return;
      }

      const email = normalizarEmail(params.get('email') ?? '');
      this.inscricao = this.inscricaoService.obterEmail(email);
    });
  }
}
