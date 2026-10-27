import { avaliarInscricao, calcularIdade, normalizarEmail } from './inscricao.regras';

describe('regras de inscrição', () => {
  it('calculates age based on the birth month, not the birth year', () => {
    expect(calcularIdade('2013-02-01', '2027-03-14')).toBe(14);
    expect(calcularIdade('2013-04-01', '2027-03-14')).toBe(13);
  });

  it('counts the birthday itself as the start of the new age', () => {
    expect(calcularIdade('2013-03-14', '2027-03-14')).toBe(14);
  });

  it('returns the calculated category for an accepted registration', () => {
    expect(avaliarInscricao('2013-02-01', 'KM_5', '2027-03-14')).toEqual({
      aceita: true,
      idadeNaProva: 14,
      categoria: 'JUVENIL',
      erro: null
    });
  });

  it('normalizes e-mail by trimming and lowercasing without changing provider aliases', () => {
    expect(normalizarEmail(' Ana.Souza@Email.COM ')).toBe('ana.souza@email.com');
    expect(normalizarEmail('ana.souza@gmail.com')).not.toBe(normalizarEmail('anasouza@gmail.com'));
  });

  it('applies the minimum age before the 10 km restriction', () => {
    expect(avaliarInscricao('2013-03-15', 'KM_10', '2027-03-14')).toEqual({
      aceita: false,
      idadeNaProva: 13,
      categoria: null,
      erro: 'IDADE_MINIMA'
    });
  });

  it('allows 5 km from age 14 and reserves 10 km for age 18 or older', () => {
    expect(avaliarInscricao('2013-03-14', 'KM_5', '2027-03-14').categoria).toBe('JUVENIL');
    expect(avaliarInscricao('2009-03-15', 'KM_10', '2027-03-14').erro).toBe('DISTANCIA_NAO_PERMITIDA');
    expect(avaliarInscricao('2009-03-14', 'KM_10', '2027-03-14').categoria).toBe('ADULTO');
  });

  it('assigns categories at the 39/40 and 59/60 boundaries', () => {
    expect(avaliarInscricao('1987-03-15', 'KM_5', '2027-03-14').categoria).toBe('ADULTO');
    expect(avaliarInscricao('1987-03-14', 'KM_5', '2027-03-14').categoria).toBe('MASTER');
    expect(avaliarInscricao('1967-03-15', 'KM_5', '2027-03-14').categoria).toBe('MASTER');
    expect(avaliarInscricao('1967-03-14', 'KM_5', '2027-03-14').categoria).toBe('SENIOR');
  });
});
