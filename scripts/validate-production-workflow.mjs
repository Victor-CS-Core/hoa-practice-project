import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = new URL('../', import.meta.url);
const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, repositoryRoot)), 'utf8');
const legacyStaticWorkflow = fileURLToPath(
  new URL('.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml', repositoryRoot),
);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const withoutCommentLines = (text) => text.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');

function jobBlock(workflow, name) {
  const match = new RegExp(`^  ${escapeRegExp(name)}:\\s*\\n`, 'm').exec(workflow);
  if (!match) return null;
  const nextJob = /^  [A-Za-z0-9_-]+:\s*$/gm;
  nextJob.lastIndex = match.index + match[0].length;
  const next = nextJob.exec(workflow);
  return workflow.slice(match.index, next?.index);
}

function namedStep(block, name) {
  return new RegExp(
    `^      - name: ${escapeRegExp(name)}\\s*\\n([\\s\\S]*?)(?=^      - name:|(?![\\s\\S]))`,
    'm',
  ).exec(block);
}

function requireStep(block, name, errors) {
  const step = namedStep(block, name);
  if (!step) errors.push(`missing named step: ${name}`);
  return step;
}

function requireText(step, text, description, errors) {
  if (!step?.[0].includes(text)) errors.push(description);
}

function validateProductionWorkflow(deployWorkflow, ciWorkflow, { checkLegacy = true } = {}) {
  const errors = [];
  const deploy = withoutCommentLines(deployWorkflow);
  const ci = withoutCommentLines(ciWorkflow);
  const deployJob = jobBlock(deploy, 'deploy');
  if (!deployJob) return ['missing deploy job'];

  const jobHeader = deployJob.slice(0, deployJob.indexOf('\n    steps:'));
  for (const [text, description] of [
    ['environment:\n      name: production', 'deploy job must use GitHub Environment production'],
    ['SLOT_NAME: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}', 'deploy job must source SLOT_NAME from the production environment variable'],
    ['MIGRATION_MODE: ${{ vars.PRODUCTION_MIGRATION_MODE }}', 'deploy job must source MIGRATION_MODE from the production environment variable'],
  ]) {
    if (!jobHeader.includes(text)) errors.push(description);
  }

  const configuration = requireStep(deployJob, 'Validate deployment configuration', errors);
  for (const [text, description] of [
    ['APP_NAME: ${{ secrets.AZURE_WEBAPP_NAME_PRODUCTION }}', 'configuration must require the App Service name'],
    ['PUBLISH_PROFILE: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}', 'configuration must require the publish profile'],
    ['SQL_CONNECTION: ${{ secrets.AZURE_SQL_CONNECTION_STRING_PRODUCTION }}', 'configuration must receive the SQL connection secret'],
    ['slot_name_canonical="${SLOT_NAME//[[:space:]]/}"', 'configuration must canonicalize SLOT_NAME once'],
    ['if [ -z "$slot_name_canonical" ]; then', 'configuration must reject whitespace-only SLOT_NAME values'],
    ['slot_name_canonical_lower="${slot_name_canonical,,}"', 'configuration must compare canonical SLOT_NAME case-insensitively'],
    ['if [ "$slot_name_canonical_lower" = "production" ]; then', 'configuration must reject the production slot'],
    ['printf \'SLOT_NAME_CANONICAL=%s\\n\' "$slot_name_canonical" >> "$GITHUB_ENV"', 'configuration must persist the validated canonical slot'],
    ['if [ "$MIGRATION_MODE" != "workflow" ] && [ "$MIGRATION_MODE" != "external" ]; then', 'configuration must allow only workflow or external migration modes'],
    ['if [ "$MIGRATION_MODE" = "workflow" ] && [ -z "$SQL_CONNECTION" ]; then', 'configuration must require SQL only for workflow migrations'],
  ]) requireText(configuration, text, description, errors);

  const publish = requireStep(deployJob, 'Publish combined BFF', errors);
  requireText(publish, 'dotnet publish HoaCommunityEvents/backend/src/API/HoaCommunityEvents.API.csproj', 'publish step must build the combined API project', errors);
  const packageVerification = requireStep(deployJob, 'Verify combined package', errors);
  requireText(packageVerification, 'wwwroot/index.html', 'combined package verification must require the SPA entry point', errors);

  const migration = requireStep(deployJob, 'Optionally apply database migrations', errors);
  requireText(migration, "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}", 'migration step must run only in workflow mode', errors);
  requireText(migration, 'SQL_CONNECTION: ${{ secrets.AZURE_SQL_CONNECTION_STRING_PRODUCTION }}', 'migration step must receive the SQL connection secret', errors);
  const externalMigration = requireStep(deployJob, 'Record external migration responsibility', errors);
  requireText(externalMigration, "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'external' }}", 'external migration responsibility must run only in external mode', errors);

  const artifact = requireStep(deployJob, 'Preserve combined release artifact', errors);
  requireText(artifact, 'uses: actions/upload-artifact@v4', 'release artifact must use upload-artifact v4', errors);
  const artifactPath = /^          path: (.+)$/m.exec(artifact?.[0] ?? '')?.[1];
  if (!artifactPath) errors.push('release artifact must declare its publish path');
  const deployStep = requireStep(deployJob, 'Deploy to Azure staging slot', errors);
  requireText(deployStep, 'id: deploy', 'Azure deploy step must have the deploy id', errors);
  requireText(deployStep, 'uses: azure/webapps-deploy@v3', 'Azure deploy step must use webapps-deploy v3', errors);
  requireText(deployStep, 'slot-name: ${{ env.SLOT_NAME_CANONICAL }}', 'Azure deploy must use the validated canonical staging slot', errors);
  const deployPath = /^          package: (.+)$/m.exec(deployStep?.[0] ?? '')?.[1];
  if (!deployPath || deployPath !== artifactPath) errors.push('artifact and Azure deploy must use the exact same publish path');

  const smoke = requireStep(deployJob, 'Smoke test staged combined BFF', errors);
  for (const [text, description] of [
    ['WEBAPP_URL: ${{ steps.deploy.outputs.webapp-url }}', 'smoke test must use the deploy action URL'],
    ['if [ -z "$WEBAPP_URL" ]; then', 'smoke test must reject an empty deploy URL'],
    ['"$base_url/health"', 'smoke test must check /health'],
    ['"$base_url/api/security/csrf"', 'smoke test must check /api/security/csrf'],
    ['require_html "/"', 'smoke test must check root HTML'],
    ['require_html "/events/release-readiness-check"', 'smoke test must check SPA fallback HTML'],
    ['[ "$health_status" != "200" ]', 'smoke test must require HTTP 200 from /health'],
    ['[ "$csrf_status" != "200" ]', 'smoke test must require HTTP 200 from /api/security/csrf'],
  ]) requireText(smoke, text, description, errors);
  if (smoke?.[0].includes('--location')) errors.push('smoke test endpoint assertions must not follow redirects');
  const htmlHelper = /          require_html\(\) \{\n([\s\S]*?)^          \}/m.exec(smoke?.[0] ?? '');
  if (!htmlHelper) {
    errors.push('smoke test must define the require_html helper');
  } else {
    requireText(htmlHelper, '[ "$status" != "200" ]', 'require_html must directly reject non-200 responses', errors);
    requireText(htmlHelper, "grep -qi '<!doctype html' \"$response_file\"", 'require_html must directly require <!doctype html', errors);
  }

  const orderedSteps = [configuration, publish, packageVerification, migration, artifact, deployStep, smoke];
  if (orderedSteps.every(Boolean)) {
    const indexes = orderedSteps.map((step) => step.index);
    if (indexes.some((index, position) => position && index <= indexes[position - 1])) {
      errors.push('release steps must validate, publish, preserve, deploy, then smoke test in order');
    }
  }

  const backend = jobBlock(ci, 'backend');
  const ciValidation = backend && namedStep(backend, 'Validate production workflow contract');
  requireText(ciValidation, 'run: node scripts/validate-production-workflow.mjs', 'CI backend job must run the production workflow contract validator', errors);
  if (backend && ciValidation && namedStep(backend, 'Restore')?.index < ciValidation.index) errors.push('CI must run the workflow contract validator before restore');
  if (checkLegacy && existsSync(legacyStaticWorkflow)) errors.push('legacy Azure Static Web Apps workflow must remain deleted');
  return errors;
}

function expectInvalid(name, workflow, expected) {
  const errors = validateProductionWorkflow(workflow, ciWorkflow, { checkLegacy: false });
  if (!errors.some((error) => error.includes(expected))) throw new Error(`Negative fixture ${name} unexpectedly passed: ${errors.join('; ')}`);
}

function moveStepAfter(workflow, name, afterName) {
  const step = namedStep(workflow, name);
  if (!step) throw new Error(`Fixture setup could not find ${name}`);
  const withoutStep = workflow.slice(0, step.index) + workflow.slice(step.index + step[0].length);
  const after = namedStep(withoutStep, afterName);
  if (!after) throw new Error(`Fixture setup could not find ${afterName}`);
  return `${withoutStep.slice(0, after.index + after[0].length)}${step[0]}${withoutStep.slice(after.index + after[0].length)}`;
}

const deployWorkflow = read('.github/workflows/deploy-api-azure.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const errors = validateProductionWorkflow(deployWorkflow, ciWorkflow);
if (errors.length > 0) throw new Error(`Deployment workflow is missing required release controls:\n- ${errors.join('\n- ')}`);

expectInvalid('comments and unrelated placement', `${deployWorkflow.replace('name: Preserve combined release artifact', 'name: Archived release artifact')}\n# - name: Preserve combined release artifact\n#   uses: actions/upload-artifact@v4`, 'missing named step: Preserve combined release artifact');
expectInvalid('whitespace slot', deployWorkflow.replace('if [ -z "$slot_name_canonical" ]; then', 'if [ -z "$SLOT_NAME" ]; then'), 'reject whitespace-only SLOT_NAME');
expectInvalid('redirect smoke request', deployWorkflow.replace('--retry 12 --retry-all-errors', '--location\n            --retry 12 --retry-all-errors'), 'must not follow redirects');
expectInvalid('migration values and SQL enforcement', deployWorkflow.replace('if [ "$MIGRATION_MODE" = "workflow" ] && [ -z "$SQL_CONNECTION" ]; then', 'if [ -z "$SQL_CONNECTION" ]; then'), 'require SQL only for workflow migrations');
for (const [endpoint, expected] of [['"$base_url/health"', 'check /health'], ['require_html "/"', 'check root HTML'], ['require_html "/events/release-readiness-check"', 'check SPA fallback HTML'], ['"$base_url/api/security/csrf"', 'check /api/security/csrf']]) {
  expectInvalid(`smoke endpoint ${endpoint}`, deployWorkflow.replace(endpoint, '"$base_url/removed"'), expected);
}
expectInvalid('HTML helper status enforcement', deployWorkflow.replace('[ "$status" != "200" ] || ', ''), 'require_html must directly reject non-200 responses');
expectInvalid('HTML helper doctype enforcement', deployWorkflow.replace("! grep -qi '<!doctype html' \"$response_file\"", 'true'), 'require_html must directly require <!doctype html');
expectInvalid('step ordering', moveStepAfter(deployWorkflow, 'Preserve combined release artifact', 'Smoke test staged combined BFF'), 'release steps must validate, publish, preserve, deploy, then smoke test in order');
expectInvalid('artifact deploy path equivalence', deployWorkflow.replace('package: ${{ runner.temp }}/hoa-bff-publish', 'package: ${{ runner.temp }}/other-publish'), 'artifact and Azure deploy must use the exact same publish path');
console.log('Production workflow contract and negative fixtures are valid.');
