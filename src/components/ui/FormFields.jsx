import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ValidationUtils from "../validation/ValidationUtils";

export const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  validation = null,
  mask = null,
  error = "",
  required = false,
  ...props 
}) => {
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Aplicar máscara se fornecida
    if (mask) {
      switch (mask) {
        case 'cpf':
          newValue = ValidationUtils.maskCPF(newValue);
          break;
        case 'cnpj':
          newValue = ValidationUtils.maskCNPJ(newValue);
          break;
        case 'phone':
          newValue = ValidationUtils.maskPhone(newValue);
          break;
        case 'cep':
          newValue = ValidationUtils.maskCEP(newValue);
          break;
      }
    }

    // Validar se função de validação foi fornecida
    if (validation && newValue) {
      const isValid = validation(newValue);
      setLocalError(isValid ? "" : "Valor inválido");
    } else {
      setLocalError("");
    }

    onChange(newValue);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        value={value}
        onChange={handleChange}
        className={displayError ? "border-red-300 focus:border-red-500" : ""}
        {...props}
      />
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
};

export const ValidatedSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  error = "",
  required = false,
  placeholder = "Selecione...",
  ...props 
}) => {
  const displayError = error;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} {...props}>
        <SelectTrigger className={displayError ? "border-red-300 focus:border-red-500" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
};

export const ValidatedTextarea = ({ 
  label, 
  value, 
  onChange, 
  error = "",
  required = false,
  maxLength = null,
  ...props 
}) => {
  const displayError = error;
  const characterCount = value ? value.length : 0;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={displayError ? "border-red-300 focus:border-red-500" : ""}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between items-center">
        {displayError && (
          <p className="text-sm text-red-600">{displayError}</p>
        )}
        {maxLength && (
          <p className="text-xs text-gray-500 ml-auto">
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export const CurrencyInput = ({ 
  label, 
  value, 
  onChange, 
  error = "",
  required = false,
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState(
    value ? ValidationUtils.maskCurrency(value) : ""
  );

  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/[^\d,]/g, '');
    const numericValue = parseFloat(inputValue.replace(',', '.')) || 0;
    
    setDisplayValue(ValidationUtils.maskCurrency(numericValue));
    onChange(numericValue);
  };

  return (
    <ValidatedInput
      label={label}
      value={displayValue}
      onChange={handleChange}
      error={error}
      required={required}
      {...props}
    />
  );
};

export const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  error = "",
  required = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "border-red-300 focus:border-red-500 pr-10" : "pr-10"}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export const FormSection = ({ title, description, children, className = "" }) => (
  <div className={`space-y-6 ${className}`}>
    <div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

export const FormAlert = ({ type = "error", message, className = "" }) => {
  const variants = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800"
  };

  return (
    <Alert className={`${variants[type]} ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default {
  ValidatedInput,
  ValidatedSelect,
  ValidatedTextarea,
  CurrencyInput,
  PasswordInput,
  FormSection,
  FormAlert
};