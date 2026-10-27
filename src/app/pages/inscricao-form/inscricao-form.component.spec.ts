import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Data, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { InscricaoFormComponent } from './inscricao-form.component';
import { InscricaoService } from '../../services/inscricao.service';

const CHAVE_STORAGE = 'corrida.inscricoes.v1';

describe('InscricaoFormComponent', () => {
  let component: InscricaoFormComponent;
  let fixture: ComponentFixture<InscricaoFormComponent>;
  let routeData: BehaviorSubject<Data>;
  let routeParams: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    routeData = new BehaviorSubject<Data>({ modo: 'editar' });
    routeParams = new BehaviorSubject<ParamMap>(
      convertToParamMap({ email: 'ana+prova@example.com' })
    );
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify([{
      nomeCompleto: 'Ana Souza',
      email: 'ana+prova@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_5'
    }]));

    await TestBed.configureTestingModule({
      imports: [InscricaoFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: routeData.value },
            data: routeData.asObservable(),
            paramMap: routeParams.asObservable()
          }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InscricaoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(CHAVE_STORAGE);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads persisted data for a direct edit URL and keeps the email disabled', () => {
    expect(component.modoEdicao).toBeTrue();
    expect(component.carregandoInscricao).toBeFalse();
    expect(component.inscricaoNaoEncontrada).toBeFalse();
    expect(component.form.controls.nomeCompleto.value).toBe('Ana Souza');
    expect(component.form.controls.email.value).toBe('ana+prova@example.com');
    expect(component.form.controls.dataNascimento.value).toBe('2010-01-01');
    expect(component.form.controls.email.disabled).toBeTrue();
  });

  it('switches from a new registration route to edit mode without reloading', () => {
    routeData.next({});
    routeParams.next(convertToParamMap({}));

    expect(component.modoEdicao).toBeFalse();
    expect(component.form.controls.dataNascimento.value).toBe('');
    expect(component.form.controls.email.enabled).toBeTrue();

    routeData.next({ modo: 'editar' });
    routeParams.next(convertToParamMap({ email: 'ana+prova@example.com' }));

    expect(component.modoEdicao).toBeTrue();
    expect(component.inscricaoNaoEncontrada).toBeFalse();
    expect(component.form.controls.nomeCompleto.value).toBe('Ana Souza');
    expect(component.form.controls.dataNascimento.value).toBe('2010-01-01');
    expect(component.form.controls.email.disabled).toBeTrue();
  });

  it('saves valid edits with the original email and navigates to the list', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.form.patchValue({
      nomeCompleto: 'Ana Silva',
      dataNascimento: '2008-01-01',
      percurso: 'KM_10'
    });

    component.salvar();

    const inscricao = TestBed.inject(InscricaoService).obterEmail('ana+prova@example.com');
    expect(inscricao).toEqual(jasmine.objectContaining({
      nomeCompleto: 'Ana Silva',
      email: 'ana+prova@example.com',
      dataNascimento: '2008-01-01',
      percurso: 'KM_10',
      idadeNaProva: 19,
      categoria: 'ADULTO'
    }));
    expect(JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? '[]')[0].email).toBe('ana+prova@example.com');
    expect(router.navigate).toHaveBeenCalledWith(['/inscricoes']);
  });

  it('keeps persisted data unchanged when the edited participant is under the minimum age', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const original = localStorage.getItem(CHAVE_STORAGE);

    component.form.patchValue({ dataNascimento: '2013-03-15', percurso: 'KM_5' });
    component.salvar();

    expect(localStorage.getItem(CHAVE_STORAGE)).toBe(original);
    expect(component.erroFormulario).toContain('idade mínima');
    expect(component.erroCampo('dataNascimento')).toContain('menos de 14 anos');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
