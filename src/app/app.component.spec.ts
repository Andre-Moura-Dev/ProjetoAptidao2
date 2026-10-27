import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { InscricaoService } from './services/inscricao.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('corrida.inscricoes.v1');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the event heading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Uma corrida que');
  });

  it('shows the active registration count in the navigation link', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const count = fixture.nativeElement.querySelector('.contador-menu') as HTMLElement;

    expect(count.textContent?.trim()).toBe('0');

    TestBed.inject(InscricaoService).cadastrar({
      nomeCompleto: 'Ana Souza',
      email: 'ana@example.com',
      dataNascimento: '2010-01-01',
      percurso: 'KM_5'
    });
    fixture.detectChanges();

    expect(count.textContent?.trim()).toBe('1');
    expect(count.getAttribute('aria-label')).toBe('1 inscrição ativa');
  });
});
