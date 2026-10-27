import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { DATA_PROVA, formatarDataProva } from './dominio/inscricao.regras';
import { InscricaoService } from './services/inscricao.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly inscricoes$ = this.inscricaoService.inscricoes$;
  readonly avisoPersistencia$ = this.inscricaoService.avisoPersistencia$;
  readonly dataProvaFormatada = formatarDataProva(DATA_PROVA);
  readonly resumo$ = this.inscricoes$.pipe(
    map(inscricoes => ({
      total: inscricoes.length,
      percurso5: inscricoes.filter(item => item.percurso === 'KM_5').length,
      percurso10: inscricoes.filter(item => item.percurso === 'KM_10').length
    }))
  );

  constructor(
    private inscricaoService: InscricaoService
  ) {}

  dispensarAviso(): void {
    this.inscricaoService.limparAvisoPersistencia();
  }
}
