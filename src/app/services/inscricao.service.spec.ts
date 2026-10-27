import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InscricaoService } from './inscricao.service';

const CHAVE_STORAGE = 'corrida.inscricoes.v1';

@Component({
  standalone: true,
  template: ''
})
class InscricaoServiceTestHost {
  constructor(readonly service: InscricaoService) {}
}

describe('InscricaoService', () => {
  let service: InscricaoService;

  beforeEach(() => {
    localStorage.removeItem(CHAVE_STORAGE);
    TestBed.configureTestingModule({
      imports: [InscricaoServiceTestHost]
    });
  });

  function criarService(): void {
    const fixture = TestBed.createComponent(InscricaoServiceTestHost);
    fixture.detectChanges();
    service = fixture.componentInstance.service;
  }

  it('should be created', () => {
    criarService();

    expect(service).toBeTruthy();
  });

  it('accepts eligible participants and returns their calculated category', () => {
    criarService();

    const resultado = service.cadastrar({
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2013-02-01',
      percurso: 'KM_5'
    });

    expect(resultado.sucesso).toBeTrue();
    expect(resultado.inscricao?.idadeNaProva).toBe(14);
    expect(resultado.inscricao?.categoria).toBe('JUVENIL');
  });

  it('loads valid 5 km registrations from local storage', () => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify([{
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2013-02-01',
      percurso: 'KM_5'
    }]));

    criarService();

    expect(service.listarTodas().length).toBe(1);
    expect(service.listarTodas()[0].percurso).toBe('KM_5');
    expect(service.listarTodas()[0].categoria).toBe('JUVENIL');
    expect(service.avisoPersistencia$.value).toBeNull();
  });

  it('reports invalid persisted routes instead of accepting them', () => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify([{
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2013-02-01',
      percurso: 'KM_8'
    }]));

    criarService();

    expect(service.listarTodas()).toEqual([]);
    expect(service.avisoPersistencia$.value).toContain('corrompidos');
  });

  it('normalizes names and emails and rejects duplicate active emails', () => {
    criarService();

    const primeiro = service.cadastrar({
      nomeCompleto: '  Ana   Souza ',
      email: ' Ana.Souza@Email.COM ',
      dataNascimento: '2000-01-01',
      percurso: 'KM_5'
    });
    const duplicado = service.cadastrar({
      nomeCompleto: 'Outra Pessoa',
      email: 'ana.souza@email.com',
      dataNascimento: '2000-01-01',
      percurso: 'KM_5'
    });

    expect(primeiro.inscricao?.nomeCompleto).toBe('Ana Souza');
    expect(primeiro.inscricao?.email).toBe('ana.souza@email.com');
    expect(duplicado.sucesso).toBeFalse();
    expect(service.listarTodas().length).toBe(1);
  });

  it('edits in place, keeps the email, recalculates derived data, and persists the new route', () => {
    criarService();
    service.cadastrar({
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2000-01-01',
      percurso: 'KM_5'
    });
    service.cadastrar({
      nomeCompleto: 'Bruno Lima',
      email: 'bruno@example.com',
      dataNascimento: '1990-01-01',
      percurso: 'KM_10'
    });

    const resultado = service.editar('ana@example.com', {
      nomeCompleto: 'Ana Silva',
      email: 'nao-deve-substituir@example.com',
      dataNascimento: '2008-01-01',
      percurso: 'KM_10'
    });

    expect(resultado.sucesso).toBeTrue();
    expect(service.listarTodas().map(inscricao => inscricao.email)).toEqual([
      'ana@example.com',
      'bruno@example.com'
    ]);
    expect(service.listarTodas()[0]).toEqual(jasmine.objectContaining({
      nomeCompleto: 'Ana Silva',
      idadeNaProva: 19,
      categoria: 'ADULTO',
      percurso: 'KM_10'
    }));
    expect(JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? '[]')[0].percurso).toBe('KM_10');
  });

  it('preserves the original registration when an edit violates the regulation and releases cancelled emails', () => {
    criarService();
    const criada = service.cadastrar({
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_5'
    });
    const original = service.listarTodas();

    const editada = service.editar('ana@example.com', {
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_10'
    });

    expect(criada.sucesso).toBeTrue();
    expect(editada.sucesso).toBeFalse();
    expect(service.listarTodas()).toEqual(original);
    expect(JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? '[]')[0].percurso).toBe('KM_5');

    expect(service.cancelar(' ANA@EXAMPLE.COM ').sucesso).toBeTrue();
    expect(service.cadastrar({
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_5'
    }).sucesso).toBeTrue();
  });
});
