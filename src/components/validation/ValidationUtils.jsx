// Utilitários para validação de formulários e mascaramento de dados

export const ValidationUtils = {
  // CPF
  validateCPF: (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Verificar sequência repetida
    if (/^(.)\1{10}$/.test(cleanCPF)) return false;
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  },

  // CNPJ
  validateCNPJ: (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;
    
    // Verificar sequência repetida
    if (/^(.)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validar primeiro dígito
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;
    if (remainder !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validar segundo dígito
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;
    if (remainder !== parseInt(cleanCNPJ.charAt(13))) return false;
    
    return true;
  },

  // Email
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Telefone
  validatePhone: (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  },

  // CEP
  validateCEP: (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8;
  },

  // Mascaramento
  maskCPF: (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  maskCNPJ: (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  maskPhone: (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  },

  maskCEP: (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  maskCurrency: (value) => {
    const numericValue = parseFloat(value) || 0;
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  // Validações de negócio
  validateDateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  },

  validatePositiveNumber: (value) => {
    const numericValue = parseFloat(value);
    return !isNaN(numericValue) && numericValue > 0;
  },

  validateFileSize: (file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  validateFileType: (file, allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileExtension);
  }
};

export default ValidationUtils;