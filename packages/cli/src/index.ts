#!/usr/bin/env node

/**
 * EDIFlow CLI Entry Point
 *
 * Presentation Layer - Command Line Interface
 * Depends on: @ediflow/core, @ediflow/edifact, @ediflow/x12
 */

import { Command } from 'commander';
import { DIContainer } from './infrastructure/container/DIContainer.js';
import { ParseCommand } from './presentation/cli/commands/ParseCommand.js';
import { BuildCommand } from './presentation/cli/commands/BuildCommand.js';
import { ValidateCommand } from './presentation/cli/commands/ValidateCommand.js';

const program = new Command();
const container = DIContainer.getInstance();

program
  .name('ediflow')
  .description('EDIFlow - Modern EDI Parser, Builder & Validator')
  .version('0.1.0');

// Parse Command
const parseCommand = new ParseCommand(container.getUseCaseFactory());
program
  .command('parse')
  .description('Parse EDI message from file or stdin')
  .option('-f, --file <path>', 'Input EDI file')
  .option('-s, --standard <standard>', 'EDI Standard (EDIFACT, X12)', 'EDIFACT')
  .option('-o, --output <path>', 'Output JSON file')
  .option('--strict', 'Enable strict validation', false)
  .action((options) => parseCommand.execute(options));

// Build Command
const buildCommand = new BuildCommand(container.getUseCaseFactory());
program
  .command('build')
  .description('Build EDI message from JSON')
  .option('-f, --file <path>', 'Input JSON file')
  .option('-o, --output <path>', 'Output EDI file')
  .option('--validate', 'Validate before building', false)
  .action((options) => buildCommand.execute(options));

// Validate Command
const validateCommand = new ValidateCommand(container.getUseCaseFactory());
program
  .command('validate')
  .description('Validate EDI message')
  .option('-f, --file <path>', 'Input EDI file')
  .option('-s, --standard <standard>', 'EDI Standard (EDIFACT, X12)', 'EDIFACT')
  .option('--strict', 'Enable strict validation', true)
  .action((options) => validateCommand.execute(options));

program.parse(process.argv);
