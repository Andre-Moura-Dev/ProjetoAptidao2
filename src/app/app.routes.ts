import { Routes } from '@angular/router';
import { InscricoesListaComponent } from './pages/inscricoes-lista/inscricoes-lista.component';
import { InscricaoFormComponent } from './pages/inscricao-form/inscricao-form.component';
import { InscricaoDetalhesComponent } from './pages/inscricao-detalhes/inscricao-detalhes.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '', redirectTo: 'inscricoes', pathMatch: 'full'
  },
  {
    path: 'inscricoes',
    component: InscricoesListaComponent,
    pathMatch: 'full'
  },
  {
    path: 'inscricoes/nova',
    component: InscricaoFormComponent,
  },
  {
    path: 'inscricoes/:email/editar',
    component: InscricaoFormComponent,
    data: {
      modo: 'editar'
    }
  },
  {
    path: 'inscricoes/:email',
    component: InscricaoDetalhesComponent,
    pathMatch: 'full'
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
