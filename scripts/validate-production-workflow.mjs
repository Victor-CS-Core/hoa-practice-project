import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = new URL('../', import.meta.url);
const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, repositoryRoot)), 'utf8');

const deployWorkflow = read('.github/workflows/deploy-api-azure.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const legacyStaticWorkflow = fileURLToPath(
  new URL('.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml', repositoryRoot),
);

const requiredDeploymentFragments = [
  'environment:\n      name: production',
  'SLOT_NAME: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}',
  'MIGRATION_MODE: ${{ vars.PRODUCTION_MIGRATION_MODE }}',
  "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}",
  'slot-name: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}',
  'uses: actions/upload-artifact@v4',
  'steps.deploy.outputs.webapp-url',
  '/api/security/csrf',
  'wwwroot/index.html',
];

const missing = requiredDeploymentFragments.filter(
  (fragment) => !deployWorkflow.includes(fragment),
);

if (missing.length > 0) {
  throw new Error(`Deployment workflow is missing required release controls:\n- ${missing.join('\n- ')}`);
}

if (existsSync(legacyStaticWorkflow)) {
  throw new Error('Legacy Azure Static Web Apps workflow must remain deleted.');
}

if (!ciWorkflow.includes('node scripts/validate-production-workflow.mjs')) {
  throw new Error('CI must run the production workflow contract validator.');
}

console.log('Production workflow contract is valid.');
