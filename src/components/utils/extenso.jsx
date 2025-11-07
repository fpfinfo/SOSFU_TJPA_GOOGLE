// Fonte da lógica: https://gist.github.com/danielfariati/6625842 com adaptações.
// Função para converter um número em valor por extenso em Reais (R$).
export function numeroParaExtenso(valor) {
  valor = valor.toFixed(2).replace('.', ',');
  var inteiros = valor.split(',')[0];
  var centavos = valor.split(',')[1];

  if (inteiros == 0) {
    return 'zero reais';
  }

  var singular = ['real', 'mil', 'milhão', 'bilhão', 'trilhão', 'quatrilhão'];
  var plural = ['reais', 'mil', 'milhões', 'bilhões', 'trilhões', 'quatrilhões'];

  var u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  var d = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  var d10 = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  var c = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  var z = 0;
  var rt = '';

  var inteirosArray = inteiros.toString().split('').reverse();
  for (var i = 0; i < inteirosArray.length; i++) {
    inteirosArray[i] = parseInt(inteirosArray[i]);
  }

  for (var i = 0; i < inteirosArray.length; i += 3) {
    var A = (i + 2) < inteirosArray.length ? inteirosArray[i + 2] : 0;
    var B = (i + 1) < inteirosArray.length ? inteirosArray[i + 1] : 0;
    var C = inteirosArray[i];

    var s = '';
    if (A > 0) {
      s += (A > 1 ? c[A] : 'cem') + ' ';
    }
    if (B > 0) {
      if (s.length > 0) s += 'e ';
      s += (B > 1 ? d[B] : d10[C]) + ' ';
    }
    if (C > 0 && B != 1) {
      if (s.length > 0 && (B > 0 || A > 0)) s += 'e ';
      s += u[C] + ' ';
    }

    if (s.trim() != '') {
      var n = s.trim();
      var S = z > 0 ? (n == 'um' ? singular[z] : plural[z]) : '';
      if (rt.length > 0) rt = n + ' ' + S + ' e ' + rt;
      else rt = n + ' ' + S;
    }
    z++;
  }
  
  // Limpeza final da string
  rt = rt.replace(' E ', ' e ').trim();
  if (rt.endsWith(' e')) {
    rt = rt.substring(0, rt.length - 2);
  }

  var R = rt.charAt(0).toUpperCase() + rt.slice(1);
  var C = '';

  if (centavos > 0) {
    var centavosNum = parseInt(centavos);
    C += ' e ';
    if (centavosNum >= 20) {
      C += d[Math.floor(centavosNum / 10)];
      if (centavosNum % 10 > 0) {
        C += ' e ' + u[centavosNum % 10];
      }
    } else if (centavosNum >= 10) {
      C += d10[centavosNum - 10];
    } else {
      C += u[centavosNum];
    }
    C += ' centavo' + (centavosNum > 1 ? 's' : '');
  }

  // Adicionar "real" ou "reais"
  if (parseInt(inteiros) === 1) {
      R += ' ' + singular[0];
  } else {
      R += ' ' + plural[0];
  }

  return (R + C).trim();
}