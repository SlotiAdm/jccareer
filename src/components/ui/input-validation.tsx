import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Alert, AlertDescription } from './alert';
import { validateInput, sanitizeText } from '@/utils/securityValidation';

interface ValidationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  required?: boolean;
  label?: string;
}

export const ValidationInput = ({
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength = 5000,
  className,
  required = false,
  label
}: ValidationInputProps) => {
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (value && value.length > 10) {
      const result = validateInput(value);
      setValidation(result);
      setShowValidation(!result.isValid);
    } else {
      setValidation({ isValid: true, errors: [] });
      setShowValidation(false);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    // Sanitiza o input em tempo real
    const sanitized = sanitizeText(newValue);
    
    // Limita o tamanho
    const limited = sanitized.substring(0, maxLength);
    
    onChange(limited);
  };

  const InputComponent = multiline ? Textarea : Input;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <InputComponent
          value={value}
          onChange={(e: any) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} ${!validation.isValid ? 'border-destructive' : ''}`}
          maxLength={maxLength}
        />
        
        {/* Indicador de status */}
        <div className="absolute right-3 top-3">
          {value.length > 10 && (
            validation.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )
          )}
        </div>
      </div>

      {/* Contador de caracteres */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{value.length}/{maxLength} caracteres</span>
        {required && value.length < 10 && (
          <span className="text-destructive">Mínimo 10 caracteres</span>
        )}
      </div>

      {/* Alertas de validação */}
      {showValidation && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};