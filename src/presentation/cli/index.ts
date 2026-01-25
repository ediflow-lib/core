#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DIContainer } from '@infrastructure/container';
import { ParseCommand, ValidateCommand, BuildCommand } from './commands';

/**
 * EDIFlow CLI
 *
 * Main entry point for the CLI application.
 * Follows Clean Architecture:
 * - Infrastructure creates DIContainer
 * - DIContainer provides UseCaseFactory
 * - Commands receive UseCaseFactory (Dependency Injection)
 */

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Create DI Container (Infrastructure bootstraps everything)
const container = new DIContainer();
const factory = container.useCaseFactory;

// Create CLI program
const program = new Command();

program
  .name('ediflow')
  .description('Modern EDI parsing, validation, and building tool')
  .version(packageJson.version);

// Register commands with dependency injection
const parseCommand = new ParseCommand(factory);
parseCommand.register(program);

const validateCommand = new ValidateCommand(factory);
validateCommand.register(program);

// TODO: BuildCommand not yet implemented
const buildCommand = new BuildCommand();
buildCommand.register(program);

// Parse CLI arguments
program.parse();
