import {
  ComposableValidationService,
  MessageMustHaveSegmentsRule,
  VersionStandardMustMatchRule,
  MessageTypeStandardMustMatchRule,
  ElementDataTypeRule,
  ElementLengthRule,
  MandatoryElementRule,
  CodeListRule,
  type IValidationRule,
  type EDIMessage,
  type MessageStructureDTO
} from '@ediflow/core';
import { ISAMustBeFirstRule } from './rules/ISAMustBeFirstRule';
import { IEAMustBeLastRule } from './rules/IEAMustBeLastRule';
import { X12SegmentTagFormatRule } from './rules/X12SegmentTagFormatRule';
import { X12EnvelopeIntegrityRule } from './rules/X12EnvelopeIntegrityRule';
import { ValidationLevel } from './ValidationLevel';

export class X12ValidationServiceBuilder {
  private service = new ComposableValidationService<EDIMessage>();

  withBasicRules(): this {
    this.service.addRule(new MessageMustHaveSegmentsRule());
    this.service.addRule(new VersionStandardMustMatchRule());
    this.service.addRule(new MessageTypeStandardMustMatchRule());
    return this;
  }

  withX12Rules(): this {
    this.service.addRule(new ISAMustBeFirstRule());
    this.service.addRule(new IEAMustBeLastRule());
    this.service.addRule(new X12SegmentTagFormatRule());
    this.service.addRule(new X12EnvelopeIntegrityRule());
    return this;
  }

  withElementRules(structure: MessageStructureDTO): this {
    this.service.addRule(new MandatoryElementRule(structure));
    this.service.addRule(new ElementDataTypeRule(structure));
    this.service.addRule(new ElementLengthRule(structure));
    return this;
  }

  withCodeListRules(structure: MessageStructureDTO, codeLists: Map<string, Set<string>>): this {
    this.service.addRule(new CodeListRule(structure, codeLists));
    return this;
  }

  withCustomRule(rule: IValidationRule<EDIMessage>): this {
    this.service.addRule(rule);
    return this;
  }

  withValidationLevel(level: ValidationLevel, structure?: MessageStructureDTO): this {
    this.withBasicRules();
    this.withX12Rules();
    const isStrict = level === ValidationLevel.STRICT;
    if (isStrict && structure) {
      this.withElementRules(structure);
    }
    return this;
  }

  build(): ComposableValidationService<EDIMessage> {
    return this.service;
  }

  static forX12(): ComposableValidationService<EDIMessage> {
    return new X12ValidationServiceBuilder()
      .withValidationLevel(ValidationLevel.LENIENT)
      .build();
  }

  static forX12Strict(structure: MessageStructureDTO): ComposableValidationService<EDIMessage> {
    return new X12ValidationServiceBuilder()
      .withBasicRules()
      .withX12Rules()
      .withElementRules(structure)
      .build();
  }

  static custom(): X12ValidationServiceBuilder {
    return new X12ValidationServiceBuilder();
  }
}






