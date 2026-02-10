$ErrorActionPreference = "Stop"

Write-Host "Updating test file imports..." -ForegroundColor Cyan

$files = @(
    "src/application/services/BusinessObjectValidationService.test.ts",
    "src/application/services/SchemaGenerationService.test.ts",
    "src/application/services/StructuralValidationService.test.ts",
    "src/application/services/StructuralValidationContext.test.ts",
    "src/application/services/MessageStructureService.test.ts",
    "src/application/use-cases/validate/ValidateMessageUseCase.integration.test.ts",
    "src/infrastructure/repositories/InMemoryMessageStructureRepository.test.ts",
    "src/presentation/cli/commands/ExportSchemaCommand.test.ts",
    "test/integration/cli/ExportSchemaCommand.test.ts",
    "test/integration/validation/BusinessObjectValidation.test.ts",
    "test/integration/repositories/FileBasedMessageStructureRepository.test.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $fullPath -Raw

        $content = $content -replace "from '@domain/repositories/MessageStructure'", "from '@infrastructure/repositories/dtos'"
        $content = $content -replace "from '\./BusinessObjectValidator'", "from './BusinessObjectValidationService'"
        $content = $content -replace "from '\./BusinessObjectSchemaGenerator'", "from './SchemaGenerationService'"
        $content = $content -replace "from '\./StructuralValidator'", "from './StructuralValidationService'"

        $content = $content -replace "new BusinessObjectValidator\(\)", "new BusinessObjectValidationService()"
        $content = $content -replace "new BusinessObjectSchemaGenerator\(", "new SchemaGenerationService("
        $content = $content -replace "new StructuralValidator\(\)", "new StructuralValidationService()"

        $content = $content -replace ": MessageStructure([\s\n>;])", ": MessageStructureDTO`$1"
        $content = $content -replace "<MessageStructure>", "<MessageStructureDTO>"
        $content = $content -replace "\(MessageStructure\)", "(MessageStructureDTO)"

        Set-Content $fullPath -Value $content -NoNewline
        Write-Host "  Updated" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "Done!" -ForegroundColor Green
