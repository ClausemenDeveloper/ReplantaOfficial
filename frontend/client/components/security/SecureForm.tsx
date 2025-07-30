import { useState, useCallback, FormEvent, ReactNode } from "react";
import {
  SecurityValidator,
  XSSProtection,
  SecureErrorHandler,
  CSRFProtection,
} from "../../lib/security";
import { AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";

interface ValidationRule {
  required?: boolean;
  type?: "email" | "phone" | "password" | "name" | "url" | "text";
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => { isValid: boolean; error?: string };
}

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "tel" | "url" | "textarea";
  placeholder?: string;
  validation: ValidationRule;
  autoComplete?: string;
  disabled?: boolean;
}

interface SecureFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  submitText?: string;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
  enableXSSProtection?: boolean;
  enableRateLimit?: boolean;
  rateLimitAction?: string;
}

interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

export default function SecureForm({
  fields,
  onSubmit,
  submitText = "Submeter",
  isLoading = false,
  className = "",
  children,
  enableXSSProtection = true,
  enableRateLimit = true,
  rateLimitAction = "form_submit",
}: SecureFormProps) {
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  // Validate single field
  const validateField = useCallback(
    (fieldName: string, value: string): string | null => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return null;

      const { validation } = field;

      // Required validation
      if (validation.required && (!value || value.trim() === "")) {
        return `${field.label} é obrigatório`;
      }

      // Skip other validations if field is empty and not required
      if (!value || value.trim() === "") return null;

      // XSS Detection
      if (enableXSSProtection && XSSProtection.detectXSS(value)) {
        SecureErrorHandler.logSecurityEvent(
          "xss_attempt_detected",
          {
            field: fieldName,
            value: value.substring(0, 100), // Log first 100 chars
          },
          "high",
        );
        return "Conteúdo potencialmente perigoso detectado";
      }

      // Length validation
      if (validation.minLength && value.length < validation.minLength) {
        return `${field.label} deve ter pelo menos ${validation.minLength} caracteres`;
      }

      if (validation.maxLength && value.length > validation.maxLength) {
        return `${field.label} deve ter no máximo ${validation.maxLength} caracteres`;
      }

      // Type-specific validation
      switch (validation.type) {
        case "email":
          if (!SecurityValidator.validateEmail(value)) {
            return "Email inválido";
          }
          break;

        case "phone":
          if (!SecurityValidator.validatePhone(value)) {
            return "Número de telefone inválido";
          }
          break;

        case "password":
          const passwordValidation = SecurityValidator.validatePassword(value);
          if (!passwordValidation.isValid) {
            return passwordValidation.errors[0];
          }
          break;

        case "name":
          if (!SecurityValidator.validateName(value)) {
            return "Nome deve conter apenas letras, espaços e hífens";
          }
          break;

        case "url":
          if (!SecurityValidator.validateURL(value)) {
            return "URL inválido";
          }
          break;
      }

      // Pattern validation
      if (validation.pattern && !validation.pattern.test(value)) {
        return `${field.label} não está no formato correto`;
      }

      // Custom validation
      if (validation.customValidator) {
        const result = validation.customValidator(value);
        if (!result.isValid) {
          return result.error || `${field.label} é inválido`;
        }
      }

      return null;
    },
    [fields, enableXSSProtection],
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      // Sanitize input
      const sanitizedValue = SecurityValidator.sanitizeInput(value);

      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [fieldName]: sanitizedValue },
        errors: {
          ...prev.errors,
          [fieldName]: validateField(fieldName, sanitizedValue) || "",
        },
        touched: { ...prev.touched, [fieldName]: true },
      }));
    },
    [validateField],
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      const value = formState.values[fieldName] || "";
      const error = validateField(fieldName, value);

      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [fieldName]: error || "" },
        touched: { ...prev.touched, [fieldName]: true },
      }));
    },
    [formState.values, validateField],
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const value = formState.values[field.name] || "";
      const error = validateField(field.name, value);

      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
      touched: fields.reduce(
        (acc, field) => ({ ...acc, [field.name]: true }),
        {},
      ),
    }));

    return isValid;
  }, [fields, formState.values, validateField]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (
      enableRateLimit &&
      !SecurityValidator.checkRateLimit(rateLimitAction, 10, 5 * 60 * 1000)
    ) {
      SecureErrorHandler.logSecurityEvent(
        "rate_limit_exceeded",
        {
          action: rateLimitAction,
        },
        "medium",
      );

      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          _form: "Muitas tentativas. Tente novamente em 5 minutos.",
        },
      }));
      return;
    }

    // Validate form
    if (!validateForm()) {
      SecureErrorHandler.logSecurityEvent("form_validation_failed", {
        action: rateLimitAction,
        errors: Object.keys(formState.errors).filter(
          (key) => formState.errors[key],
        ),
      });
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Add CSRF token to form data
      const csrfToken = CSRFProtection.getToken() ?? "";
      const formData: Record<string, string> = {
        ...formState.values,
        _token: csrfToken,
      };

      await onSubmit(formData);

      // Clear rate limit on successful submission
      SecurityValidator.clearRateLimit(rateLimitAction);

      // Log successful submission
      SecureErrorHandler.logSecurityEvent("form_submitted", {
        action: rateLimitAction,
        fields: fields.map((f) => f.name),
      });
    } catch (error) {
      SecureErrorHandler.handleError(error as Error, "Form submission");

      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          _form:
            error instanceof Error
              ? error.message
              : "Erro ao submeter formulário",
        },
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const hasErrors = Object.values(formState.errors).some((error) => error);
  const isFormValid = !hasErrors && fields.length > 0;

  return (
    <div className={`secure-form ${className}`}>
      {/* Security indicator */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
        <Shield className="w-4 h-4 text-garden-green" />
        <span>Formulário protegido por medidas de segurança</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {fields.map((field) => {
          const fieldValue = formState.values[field.name] || "";
          const fieldError = formState.errors[field.name];
          const isTouched = formState.touched[field.name];
          const showError = isTouched && fieldError;

          return (
            <div key={field.name} className="space-y-2">
              <Label
                htmlFor={field.name}
                className={`text-sm font-medium ${
                  showError ? "text-red-600" : "text-gray-700"
                }`}
              >
                {field.label}
                {field.validation.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              <div className="relative">
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={fieldValue}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    onBlur={() => handleFieldBlur(field.name)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    disabled={field.disabled || isLoading}
                    className={`${
                      showError
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-garden-green"
                    }`}
                    rows={4}
                  />
                ) : (
                  <>
                    <Input
                      id={field.name}
                      name={field.name}
                      type={
                        field.type === "password" && showPasswords[field.name]
                          ? "text"
                          : field.type
                      }
                      value={fieldValue}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      onBlur={() => handleFieldBlur(field.name)}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      disabled={field.disabled || isLoading}
                      className={`${
                        showError
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-300 focus:border-garden-green"
                      } ${field.type === "password" ? "pr-10" : ""}`}
                    />

                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.name)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[field.name] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {showError && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{fieldError}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Form-level error */}
        {formState.errors._form && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{formState.errors._form}</span>
          </div>
        )}

        {/* Additional children */}
        {children}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!isFormValid || formState.isSubmitting || isLoading}
          className="w-full garden-button py-3"
        >
          {formState.isSubmitting || isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>A processar...</span>
            </div>
          ) : (
            submitText
          )}
        </Button>

        {/* Security info */}
        <div className="text-xs text-gray-500 text-center">
          Este formulário está protegido contra ataques XSS, CSRF e força bruta
        </div>
      </form>
    </div>
  );
}

// Pre-configured secure forms for common use cases
export const SecureLoginForm = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}) => {
  const fields: FormField[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "seu.email@exemplo.com",
      autoComplete: "username",
      validation: { required: true, type: "email" },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      autoComplete: "current-password",
      validation: { required: true, minLength: 8 },
    },
  ];

  return (
    <SecureForm
      fields={fields}
      onSubmit={onSubmit}
      submitText="Entrar"
      isLoading={isLoading}
      rateLimitAction="login"
    />
  );
};

export const SecureRegisterForm = ({
  onSubmit,
  isLoading,
  userType = "client",
}: {
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
  userType?: "client" | "admin" | "collaborator";
}) => {
  const fields: FormField[] = [
    {
      name: "name",
      label: "Nome Completo",
      type: "text",
      placeholder: "Seu nome completo",
      autoComplete: "name",
      validation: { required: true, type: "name" },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "seu.email@exemplo.com",
      autoComplete: "username",
      validation: { required: true, type: "email" },
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      placeholder: "+351 912 345 678",
      autoComplete: "tel",
      validation: { required: true, type: "phone" },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      autoComplete: "new-password",
      validation: { required: true, type: "password" },
    },
    {
      name: "confirmPassword",
      label: "Confirmar Password",
      type: "password",
      placeholder: "••••••••",
      autoComplete: "new-password",
      validation: {
        required: true,
        customValidator: (value) => {
          // This would need access to password field value
          return { isValid: true }; // Simplified for now
        },
      },
    },
  ];

  if (userType === "admin") {
    fields.splice(3, 0, {
      name: "adminCode",
      label: "Código Administrativo",
      type: "text",
      placeholder: "Código fornecido pela administração",
      validation: {
        required: true,
        customValidator: (value) => ({
          isValid: SecurityValidator.validateAdminCode(value),
          error:
            "Código administrativo inválido (8-16 caracteres alfanuméricos)",
        }),
      },
    });
  }

  return (
    <SecureForm
      fields={fields}
      onSubmit={onSubmit}
      submitText="Registar"
      isLoading={isLoading}
      rateLimitAction="register"
    />
  );
};
