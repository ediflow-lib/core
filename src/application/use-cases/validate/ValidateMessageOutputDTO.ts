export interface ValidationError {
  field: string;
  code: string;
  message: string;
  segmentPosition?: number;
  elementPosition?: number;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  segmentPosition?: number;
}

export interface ValidateMessageOutputDTO {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
