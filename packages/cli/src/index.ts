#!/usr/bin/env node

/**
 * EDIFlow CLI Entry Point
 *
 * Presentation Layer - Command Line Interface
 * Depends on: @ediflow/core, @ediflow/edifact, @ediflow/infrastructure-shared
 */

import { Command } from 'commander';
import { DIContainer } from '@infrastructure/container';
import { ParseCommand } from '@presentation/cli/commands';
import { BuildCommand } from '@presentation/cli/commands';
import { ValidateCommand } from '@presentation/cli/commands';

const program = new Command();
const container = DIContainer.getInstance();

program
  .name('ediflow')
  .description('EDIFlow - Modern EDI Parser, Builder & Validator')
  .version('0.1.0');

// Register commands with dependency injection
const parseCommand = new ParseCommand(container.useCaseFactory);
parseCommand.register(program);

const buildCommand = new BuildCommand(container.useCaseFactory);
buildCommand.register(program);

const validateCommand = new ValidateCommand(container.useCaseFactory);
validateCommand.register(program);

container.exportSchemaCommand.register(program);

program.parse(process.argv);
