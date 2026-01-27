/**
 * JSONSchema Interface (JSON Schema Draft 7)
 *
 * Represents a JSON Schema for validating business objects.
 * Generated at runtime from MessageStructure.
 *
 * @see https://json-schema.org/draft-07/schema
 */

export interface JSONSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type: JSONSchemaType;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean;
  pattern?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
}

export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';
