export interface BuildError {
  code: string;
  message: string;
  field?: string;
}

export interface BuildEDIOutputDTO {
  success: boolean;
  ediString?: string;
  errors?: BuildError[];
}
