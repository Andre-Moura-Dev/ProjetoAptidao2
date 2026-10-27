import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Data, Router, RouterLink } from '@angular/router';
import {
  dataIsoValida,
  dataLocalHoje,
  formatarDataProva,
  normalizarEmail,
  normalizarNome,
  DATA_PROVA
} from '../../dominio/inscricao.regras';
import { CampoInscricao, DadosInscricao } from '../../models/inscricao.model';
import { Distancia } from '../../dominio/inscricao.regras';
import { InscricaoService } from '../../services/inscricao.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EMPTY, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';

const VALIDAR_NOME: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const nome = normalizarNome(String(control.value ?? ''));
  if (!nome) return { required: true };
  if (nome.length < 3) return { minlength: true };
  if (nome.length > 100) return { maxlength: true };
  return null;
};

const VALIDAR_EMAIL: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const email = normalizarEmail(String(control.value ?? ''));
  if (!email) return { required: true };
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : { email: true };
};

const VALIDAR_NASCIMENTO: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const data = String(control.value ?? '');
  if (!data) return { required: true };
  if (!dataIsoValida(data)) return { dataInvalida: true };
  return data < dataLocalHoje() ? null : { dataNaoAnterior: true };
};

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  selector: 'app-inscricao-form',
  templateUrl: './inscricao-form.component.html',
  styleUrl: './inscricao-form.component.scss'
})
export class InscricaoFormComponent implements OnInit {
  readonly dataProvaFormatada = formatarDataProva(DATA_PROVA);
  readonly hoje = dataLocalHoje();
  modoEdicao = false;
  carregandoInscricao = false;
  inscricaoNaoEncontrada = false;
  emailOriginal = '';
  erroFormulario = '';
  errosServidor: Partial<Record<CampoInscricao, string>> = {};

  form = new FormGroup({
    nomeCompleto: new FormControl('', { nonNullable: true, validators: [VALIDAR_NOME] }),
    email: new FormControl('', { nonNullable: true, validators: [VALIDAR_EMAIL] }),
    dataNascimento: new FormControl('', { nonNullable: true, validators: [VALIDAR_NASCIMENTO] }),
    percurso: new FormControl<Distancia>('KM_5', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private  route: ActivatedRoute,
    private  router: Router,
    private  inscricaoService: InscricaoService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.route.data,
      this.route.paramMap,
    ]).pipe(
      map(([data, params]) => ({
        modoEdicao: data['modo'] === 'editar',
        email: normalizarEmail(params.get('email') ?? '')
      })),
      distinctUntilChanged((anterior, atual) =>
        anterior.modoEdicao === atual.modoEdicao && anterior.email === atual.email
      ),
      switchMap(({ modoEdicao, email }) => {
        this.modoEdicao = modoEdicao;
        this.emailOriginal = email;
        this.erroFormulario = '';
        this.errosServidor = {};
        this.inscricaoNaoEncontrada = false;

        if (!modoEdicao) {
          this.carregandoInscricao = false;
          this.form.controls.email.enable();
          this.form.reset({
            nomeCompleto: '',
            email: '',
            dataNascimento: '',
            percurso: 'KM_5'
          });
          return EMPTY;
        }

        this.carregandoInscricao = true;
        return this.inscricaoService.carregamentoConcluido$.pipe(
          filter(carregamentoConcluido => carregamentoConcluido),
          take(1),
          map(() => this.inscricaoService.obterEmail(email))
        );
      })
    ).subscribe(inscricao => {
      this.carregandoInscricao = false;
      this.inscricaoNaoEncontrada = !inscricao;

      if (!inscricao) {
        return;
      }

      this.form.patchValue({
        nomeCompleto: inscricao.nomeCompleto,
        email: inscricao.email,
        dataNascimento: inscricao.dataNascimento,
        percurso: inscricao.percurso
      });
      this.form.controls.email.disable();
    });
  }

  salvar(): void {
    this.erroFormulario = '';
    this.errosServidor = {};
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.erroFormulario = 'Confira os campos destacados antes de continuar.';
      return;
    }

    const valor = this.form.getRawValue();
    const dados: DadosInscricao = {
      nomeCompleto: valor.nomeCompleto,
      email: valor.email,
      dataNascimento: valor.dataNascimento,
      percurso: valor.percurso
    };

    const resultado = this.modoEdicao
      ? this.inscricaoService.editar(this.emailOriginal, dados)
      : this.inscricaoService.cadastrar(dados);

    if (!resultado.sucesso) {
      this.erroFormulario = resultado.mensagem ?? 'Não foi possível salvar a inscrição.';
      this.errosServidor = resultado.erros ?? {};
      return;
    }

    void this.router.navigate(['/inscricoes']);
  }

  erroCampo(campo: CampoInscricao): string {
    return this.errosServidor[campo] ?? '';
  }

  voltar(): void {
    void this.router.navigate(['/inscricoes']);
  }
}
