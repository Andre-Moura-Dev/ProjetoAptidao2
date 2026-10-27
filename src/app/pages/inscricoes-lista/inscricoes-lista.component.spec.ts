import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InscricoesListaComponent } from './inscricoes-lista.component';

describe('InscricoesListaComponent', () => {
  let component: InscricoesListaComponent;
  let fixture: ComponentFixture<InscricoesListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscricoesListaComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InscricoesListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
