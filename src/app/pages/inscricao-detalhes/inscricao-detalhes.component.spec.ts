import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { InscricaoDetalhesComponent } from './inscricao-detalhes.component';
import { InscricaoService } from '../../services/inscricao.service';

const CHAVE_STORAGE = 'corrida.inscricoes.v1';

describe('InscricaoDetalhesComponent', () => {
  let component: InscricaoDetalhesComponent;
  let fixture: ComponentFixture<InscricaoDetalhesComponent>;

  beforeEach(async () => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify([{
      nomeCompleto: 'Ana Souza',
      email: 'ana+prova@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_5'
    }]));

    await TestBed.configureTestingModule({
      imports: [InscricaoDetalhesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ email: 'ana+prova@example.com' })) }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InscricaoDetalhesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resolves a direct details URL after loading persisted data', () => {
    expect(TestBed.inject(InscricaoService).carregamentoConcluido$.value).toBeTrue();
    expect(component.carregando).toBeFalse();
    expect(component.inscricao?.email).toBe('ana+prova@example.com');
    expect(fixture.nativeElement.textContent).toContain('Ana Souza');
    expect(fixture.nativeElement.textContent).not.toContain('Inscrição não encontrada');
  });
});
