import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = new URL('../', import.meta.url);
const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, repositoryRoot)), 'utf8').replace(/\r\n?/g, '\n');
const legacyStaticWorkflow = fileURLToPath(
  new URL('.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml', repositoryRoot),
);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const withoutCommentLines = (text) =>
  text.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
const reviewedActionPins = new Map([
  ['actions/checkout', '11d5960a326750d5838078e36cf38b85af677262'],
  ['actions/setup-dotnet', '67a3573c9a986a3f9c594539f4ab511d57bb3ce9'],
  ['actions/setup-node', '49933ea5288caeca8642d1e84afbd3f7d6820020'],
  ['actions/upload-artifact', 'ea165f8d65b6e75b540449e92b4886f43607fa02'],
  ['actions/download-artifact', 'd3f86a106a0bac45b974a628896c90dbdf5c8093'],
  ['azure/webapps-deploy', '02a81bead70021f5284939794bcec79c271ab383'],
]);

function workflowHeader(workflow) {
  const jobsIndex = workflow.indexOf('\njobs:');
  return jobsIndex < 0 ? workflow : workflow.slice(0, jobsIndex);
}

function jobBlock(workflow, name) {
  const match = new RegExp(`^  ${escapeRegExp(name)}:\\s*\\n`, 'm').exec(workflow);
  if (!match) return null;
  const nextJob = /^  [A-Za-z0-9_-]+:\s*$/gm;
  nextJob.lastIndex = match.index + match[0].length;
  const next = nextJob.exec(workflow);
  return workflow.slice(match.index, next?.index);
}

function jobHeader(block) {
  if (!block) return '';
  const stepsIndex = block.indexOf('\n    steps:');
  return stepsIndex < 0 ? block : block.slice(0, stepsIndex);
}

function namedStep(block, name) {
  if (!block) return null;
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

function requireText(container, value, description, errors) {
  const text = typeof container === 'string' ? container : container?.[0];
  if (!text?.includes(value)) errors.push(description);
}

function rejectText(container, value, description, errors) {
  const text = typeof container === 'string' ? container : container?.[0];
  if (text?.includes(value)) errors.push(description);
}

function requireOrdered(items, description, errors) {
  if (!items.every(Boolean)) return;
  const indexes = items.map((item) => item.index);
  if (indexes.some((index, position) => position > 0 && index <= indexes[position - 1])) {
    errors.push(description);
  }
}

function validateActionPins(workflow, workflowName, errors) {
  const uses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)];
  for (const match of uses) {
    const reference = match[1];
    if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
    const separator = reference.lastIndexOf('@');
    const action = separator < 0 ? reference : reference.slice(0, separator);
    const ref = separator < 0 ? '' : reference.slice(separator + 1);
    const reviewedPin = reviewedActionPins.get(action.toLowerCase());
    if (!/^[0-9a-f]{40}$/.test(ref)) {
      errors.push(`${workflowName} action ${action} must use a full 40-character commit SHA`);
    } else if (!reviewedPin || ref !== reviewedPin) {
      errors.push(`${workflowName} action ${action} must use its reviewed commit SHA`);
    }
  }
}

function validateCiWorkflow(ci, errors) {
  const header = workflowHeader(ci);
  requireText(header, 'permissions:\n  contents: read', 'CI must explicitly grant only contents: read', errors);
  rejectText(header, ': write', 'CI must not grant write permissions', errors);
  validateActionPins(ci, 'CI', errors);

  const backend = jobBlock(ci, 'backend');
  if (!backend) {
    errors.push('CI must define the backend job');
    return;
  }

  const workflowValidation = requireStep(backend, 'Validate production workflow contract', errors);
  requireText(
    workflowValidation,
    'run: node scripts/validate-production-workflow.mjs',
    'CI backend job must run the production workflow contract validator',
    errors,
  );

  const syntaxValidation = requireStep(backend, 'Validate workflow syntax with actionlint', errors);
  for (const [value, description] of [
    ['ACTIONLINT_VERSION: 1.7.12', 'actionlint must use the reviewed fixed version'],
    ['ACTIONLINT_SHA256: 8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8', 'actionlint archive must use the published SHA-256'],
    ['actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz', 'actionlint must download the fixed Linux amd64 archive'],
    ['sha256sum --check --strict', 'actionlint archive digest must be verified'],
    ['.github/workflows/ci.yml', 'actionlint must validate CI workflow syntax'],
    ['.github/workflows/deploy-api-azure.yml', 'actionlint must validate deployment workflow syntax'],
  ]) requireText(syntaxValidation, value, description, errors);

  const restore = requireStep(backend, 'Restore', errors);
  const publish = requireStep(backend, 'Publish combined BFF', errors);
  requireText(
    publish,
    'dotnet publish HoaCommunityEvents/backend/src/API/HoaCommunityEvents.API.csproj',
    'CI must publish the combined API project',
    errors,
  );
  const packageVerification = requireStep(backend, 'Verify combined package', errors);
  requireText(packageVerification, 'HoaCommunityEvents.API.dll', 'CI package verification must require the API DLL', errors);
  requireText(packageVerification, 'wwwroot/index.html', 'CI package verification must require the SPA entry point', errors);
  const packageArtifact = requireStep(backend, 'Package SHA-addressed combined BFF artifact', errors);
  for (const [value, description] of [
    ['ARTIFACT_SHA: ${{ github.sha }}', 'CI package step must bind the archive to github.sha'],
    ['hoa-bff-${ARTIFACT_SHA}.tar.gz', 'CI package archive must be SHA-addressed'],
    ['sha256sum "$archive_name" > "$archive_name.sha256"', 'CI package must include a SHA-256 manifest'],
  ]) requireText(packageArtifact, value, description, errors);
  const uploadArtifact = requireStep(backend, 'Upload SHA-addressed combined BFF artifact', errors);
  for (const [value, description] of [
    ['uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02', 'CI artifact upload must use the reviewed action pin'],
    ['name: hoa-bff-${{ github.sha }}', 'CI artifact name must contain the exact commit SHA'],
    ['path: ${{ runner.temp }}/hoa-bff-artifact', 'CI artifact upload must use the packaged release directory'],
    ['if-no-files-found: error', 'CI artifact upload must fail when files are missing'],
    ['retention-days: 30', 'CI artifact must be retained for 30 days'],
  ]) requireText(uploadArtifact, value, description, errors);

  requireOrdered(
    [workflowValidation, syntaxValidation, restore, publish, packageVerification, packageArtifact, uploadArtifact],
    'CI must validate, build, verify, package, and upload the release artifact in order',
    errors,
  );
  rejectText(ci, 'AZURE_SQL_CONNECTION_STRING_PRODUCTION', 'CI must not receive the production SQL secret', errors);
}

function requireArtifactDownload(step, shaExpression, runIdExpression, owner, errors) {
  for (const [value, description] of [
    ['uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093', `${owner} artifact download must use the reviewed action pin`],
    [`name: hoa-bff-${shaExpression}`, `${owner} must download the exact SHA-addressed artifact`],
    ['github-token: ${{ github.token }}', `${owner} artifact download must use the scoped GitHub token`],
    ['repository: ${{ github.repository }}', `${owner} artifact download must remain in the current repository`],
    [`run-id: ${runIdExpression}`, `${owner} must download from the selected exact successful CI run`],
  ]) requireText(step, value, description, errors);
}

function requireArtifactVerification(step, shaExpression, owner, errors) {
  for (const [value, description] of [
    [`ARTIFACT_SHA: ${shaExpression}`, `${owner} artifact verification must use the verified release SHA`],
    ['sha256sum --check --strict', `${owner} must verify the CI artifact digest`],
    ['HoaCommunityEvents.API.dll', `${owner} must verify the API DLL from the CI artifact`],
    ['wwwroot/index.html', `${owner} must verify the SPA entry point from the CI artifact`],
  ]) requireText(step, value, description, errors);
}

function validateSmokeStep(smoke, errors) {
  for (const [value, description] of [
    ['WEBAPP_URL: ${{ steps.deploy.outputs.webapp-url }}', 'smoke test must use the deploy action URL'],
    ['if [ -z "$WEBAPP_URL" ]; then', 'smoke test must reject an empty deploy URL'],
    ['"$base_url/health"', 'smoke test must check /health'],
    ['"$base_url/api/security/csrf"', 'smoke test must check /api/security/csrf'],
    ['require_html "/"', 'smoke test must check root HTML'],
    ['require_html "/events/release-readiness-check"', 'smoke test must check SPA fallback HTML'],
    ['[ "$health_status" != "200" ]', 'smoke test must require HTTP 200 from /health'],
    ['[ "$csrf_status" != "200" ]', 'smoke test must require HTTP 200 from /api/security/csrf'],
  ]) requireText(smoke, value, description, errors);
  rejectText(smoke, '--location', 'smoke test endpoint assertions must not follow redirects', errors);
  const htmlHelper = /          require_html\(\) \{\n([\s\S]*?)^          \}/m.exec(smoke?.[0] ?? '');
  if (!htmlHelper) {
    errors.push('smoke test must define the require_html helper');
  } else {
    requireText(htmlHelper, '[ "$status" != "200" ]', 'require_html must directly reject non-200 responses', errors);
    requireText(htmlHelper, "grep -qi '<!doctype html' \"$response_file\"", 'require_html must directly require <!doctype html', errors);
  }
}

function validateDeploymentWorkflow(deploy, errors) {
  const header = workflowHeader(deploy);
  for (const [value, description] of [
    ['workflow_dispatch:', 'deployment workflow must allow reviewed manual dispatch'],
    ['workflow_run:', 'deployment workflow must be triggered from CI completion'],
    ['workflows: [CI]', 'workflow_run must target CI'],
    ['types: [completed]', 'workflow_run must target completed runs'],
    ['branches: [main]', 'workflow_run must be restricted to main'],
    ['permissions: {}', 'deployment workflow must default the token to no permissions'],
  ]) requireText(header, value, description, errors);
  rejectText(deploy, ': write', 'deployment workflow must not grant write permissions', errors);
  rejectText(deploy, 'dotnet publish', 'deployment workflow must never republish the combined BFF', errors);
  rejectText(deploy, 'actions/upload-artifact@', 'deployment workflow must not replace the CI artifact', errors);
  rejectText(deploy, 'az webapp deployment slot swap', 'deployment workflow must not swap or promote the staging slot', errors);
  validateActionPins(deploy, 'deployment', errors);

  const prepare = jobBlock(deploy, 'prepare');
  const databaseGate = jobBlock(deploy, 'database_gate');
  const stagingDeploy = jobBlock(deploy, 'deploy');
  if (!prepare) errors.push('deployment workflow must define the prepare job');
  if (!databaseGate) errors.push('deployment workflow must define the database_gate job');
  if (!stagingDeploy) errors.push('deployment workflow must define the deploy job');
  if (!prepare || !databaseGate || !stagingDeploy) return;

  const prepareHeader = jobHeader(prepare);
  for (const [value, description] of [
    ["github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'", 'prepare must restrict manual dispatch to main'],
    ["github.event_name == 'workflow_run'", 'prepare must guard privileged workflow_run execution'],
    ["github.event.workflow_run.conclusion == 'success'", 'prepare must require successful workflow_run conclusion'],
    ["github.event.workflow_run.event == 'push'", 'prepare must require a push-triggered CI run'],
    ["github.event.workflow_run.head_branch == 'main'", 'prepare must require the main CI branch'],
    ['github.event.workflow_run.head_repository.full_name == github.repository', 'prepare must reject workflow_run events from forks'],
    ['actions: read\n      contents: read', 'prepare must grant only actions and contents read'],
    ['deploy_sha: ${{ steps.release.outputs.deploy_sha }}', 'prepare must expose the verified release SHA'],
    ['ci_run_id: ${{ steps.release.outputs.ci_run_id }}', 'prepare must expose the exact successful CI run id'],
  ]) requireText(prepareHeader, value, description, errors);
  rejectText(prepareHeader, 'environment:', 'prepare must not be held behind a deployment environment', errors);

  const resolveRun = requireStep(prepare, 'Resolve trusted CI run', errors);
  for (const [value, description] of [
    ['current_main=$(gh api "repos/$GH_REPO/git/ref/heads/main" --jq \'.object.sha\')', 'prepare must resolve the current main SHA'],
    ['if [ "$DEPLOY_SHA" != "$current_main" ]; then', 'prepare must reject stale release SHAs'],
    ['ci_run_id="$TRIGGER_RUN_ID"', 'workflow_run deployment must use its exact triggering CI run'],
    ['actions/workflows/ci.yml/runs', 'manual deployment must locate a successful CI run from ci.yml'],
    ['actions/runs/$ci_run_id', 'prepare must fetch the selected exact CI run'],
    ['.path == ".github/workflows/ci.yml"', 'prepare must verify the selected run workflow path'],
    ['.head_sha == $sha', 'prepare must verify the selected run commit SHA'],
    ['.head_branch == "main"', 'prepare must verify the selected run branch'],
    ['.event == "push"', 'prepare must verify the selected run event'],
    ['.status == "completed" and\n            .conclusion == "success"', 'prepare must verify the selected run succeeded'],
    ['.head_repository.full_name == $repo', 'prepare must verify the selected run head repository'],
    ['.repository.full_name == $repo', 'prepare must verify the selected run repository'],
    ['deploy_sha=$DEPLOY_SHA', 'prepare must record the verified release SHA output'],
    ['ci_run_id=$ci_run_id', 'prepare must record the selected CI run id output'],
  ]) requireText(resolveRun, value, description, errors);

  const prepareDownload = requireStep(prepare, 'Download exact CI artifact', errors);
  requireArtifactDownload(prepareDownload, '${{ steps.release.outputs.deploy_sha }}', '${{ steps.release.outputs.ci_run_id }}', 'prepare', errors);
  const prepareVerification = requireStep(prepare, 'Verify exact CI artifact', errors);
  requireArtifactVerification(prepareVerification, '${{ steps.release.outputs.deploy_sha }}', 'prepare', errors);
  requireOrdered([resolveRun, prepareDownload, prepareVerification], 'prepare must resolve, download, and verify the trusted CI artifact in order', errors);

  const databaseHeader = jobHeader(databaseGate);
  for (const [value, description] of [
    ['needs: prepare', 'database_gate must depend on prepare'],
    ['name: production-database', 'database_gate must use the production-database Environment'],
    ['permissions:\n      contents: read', 'database_gate must grant only contents read'],
    ['MIGRATION_MODE: ${{ vars.PRODUCTION_MIGRATION_MODE }}', 'database_gate must use the explicit migration mode'],
  ]) requireText(databaseHeader, value, description, errors);
  rejectText(databaseHeader, 'name: production\n', 'database_gate and staging deploy must use distinct Environments', errors);
  const migrationMode = requireStep(databaseGate, 'Validate migration mode', errors);
  requireText(migrationMode, 'if [ "$MIGRATION_MODE" != "workflow" ] && [ "$MIGRATION_MODE" != "external" ]; then', 'database_gate must allow only workflow or external migration mode', errors);
  const checkout = requireStep(databaseGate, 'Checkout exact release for migration', errors);
  requireText(checkout, "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}", 'migration checkout must run only in workflow mode', errors);
  requireText(checkout, 'ref: ${{ needs.prepare.outputs.deploy_sha }}', 'migration checkout must use the verified release SHA', errors);
  const setupDotnet = requireStep(databaseGate, 'Setup .NET for migration', errors);
  requireText(setupDotnet, "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}", 'migration .NET setup must run only in workflow mode', errors);
  const migration = requireStep(databaseGate, 'Apply production database migrations', errors);
  for (const [value, description] of [
    ["if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}", 'migration must run only in workflow mode'],
    ['SQL_CONNECTION: ${{ secrets.AZURE_SQL_CONNECTION_STRING_PRODUCTION }}', 'only the migration step must receive the SQL secret'],
    ['if [ -z "$SQL_CONNECTION" ]; then', 'migration step must reject an empty SQL secret'],
    ['dotnet ef database update', 'workflow migration mode must execute the reviewed EF migration'],
  ]) requireText(migration, value, description, errors);
  const externalMigration = requireStep(databaseGate, 'Record external migration release gate', errors);
  requireText(externalMigration, "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'external' }}", 'external migration gate must run only in external mode', errors);
  requireText(externalMigration, 'approved external release gate', 'external mode must record the approved database release gate', errors);
  requireOrdered([migrationMode, checkout, setupDotnet, migration], 'database_gate must validate its mode before any workflow migration', errors);

  const deployHeader = jobHeader(stagingDeploy);
  for (const [value, description] of [
    ['needs: [prepare, database_gate]', 'deploy must depend on prepare and database_gate'],
    ['name: production', 'deploy must use the production Environment'],
    ['permissions:\n      actions: read', 'deploy must grant only actions read'],
    ['DEPLOY_SHA: ${{ needs.prepare.outputs.deploy_sha }}', 'deploy must use the verified release SHA'],
    ['CI_RUN_ID: ${{ needs.prepare.outputs.ci_run_id }}', 'deploy must use the exact successful CI run id'],
    ['SLOT_NAME: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}', 'deploy must source the staging slot from the production Environment'],
  ]) requireText(deployHeader, value, description, errors);
  rejectText(deployHeader, 'production-database', 'deploy and database_gate must use distinct Environments', errors);

  const configuration = requireStep(stagingDeploy, 'Validate staging deployment configuration', errors);
  for (const [value, description] of [
    ['APP_NAME: ${{ secrets.AZURE_WEBAPP_NAME_PRODUCTION }}', 'staging configuration must require the App Service name'],
    ['PUBLISH_PROFILE: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}', 'staging configuration must require the publish profile'],
    ['slot_name_canonical="${SLOT_NAME//[[:space:]]/}"', 'staging configuration must canonicalize SLOT_NAME once'],
    ['if [ -z "$slot_name_canonical" ]; then', 'staging configuration must reject whitespace-only SLOT_NAME values'],
    ['slot_name_canonical_lower="${slot_name_canonical,,}"', 'staging configuration must compare the canonical slot case-insensitively'],
    ['if [ "$slot_name_canonical_lower" = "production" ]; then', 'staging configuration must reject the production slot'],
    ['SLOT_NAME_CANONICAL=%s\\n', 'staging configuration must export the validated canonical slot'],
  ]) requireText(configuration, value, description, errors);
  rejectText(configuration, 'AZURE_SQL_CONNECTION_STRING_PRODUCTION', 'staging validation must not receive the SQL secret', errors);

  const deployDownload = requireStep(stagingDeploy, 'Download exact CI artifact', errors);
  requireArtifactDownload(deployDownload, '${{ needs.prepare.outputs.deploy_sha }}', '${{ needs.prepare.outputs.ci_run_id }}', 'deploy', errors);
  const deployVerification = requireStep(stagingDeploy, 'Verify exact CI artifact', errors);
  requireArtifactVerification(deployVerification, '${{ needs.prepare.outputs.deploy_sha }}', 'deploy', errors);
  const deployStep = requireStep(stagingDeploy, 'Deploy exact artifact to Azure staging slot', errors);
  for (const [value, description] of [
    ['id: deploy', 'Azure staging deploy step must expose the deploy output'],
    ['uses: azure/webapps-deploy@02a81bead70021f5284939794bcec79c271ab383', 'Azure staging deploy must use the reviewed action pin'],
    ['slot-name: ${{ env.SLOT_NAME_CANONICAL }}', 'Azure staging deploy must use the validated canonical slot'],
    ['package: ${{ runner.temp }}/hoa-bff-publish', 'Azure staging deploy must use the verified CI artifact directory'],
  ]) requireText(deployStep, value, description, errors);
  const smoke = requireStep(stagingDeploy, 'Smoke test staged combined BFF', errors);
  validateSmokeStep(smoke, errors);
  requireOrdered([configuration, deployDownload, deployVerification, deployStep, smoke], 'deploy must validate, download, verify, stage, and smoke-test the exact CI artifact in order', errors);

  const sqlSecretOccurrences = deploy.match(/AZURE_SQL_CONNECTION_STRING_PRODUCTION/g)?.length ?? 0;
  if (sqlSecretOccurrences !== 1) errors.push('production SQL secret must appear exactly once, on the conditional migration step');
}

function validateProductionWorkflow(deployWorkflow, ciWorkflow, { checkLegacy = true } = {}) {
  const errors = [];
  const deploy = withoutCommentLines(deployWorkflow);
  const ci = withoutCommentLines(ciWorkflow);
  validateCiWorkflow(ci, errors);
  validateDeploymentWorkflow(deploy, errors);
  if (checkLegacy && existsSync(legacyStaticWorkflow)) errors.push('legacy Azure Static Web Apps workflow must remain deleted');
  return errors;
}

function replaceRequired(workflow, search, replacement, fixtureName) {
  if (!workflow.includes(search)) throw new Error(`Negative fixture ${fixtureName} could not find its source text`);
  return workflow.replace(search, replacement);
}

function expectInvalid(name, { deploy = deployWorkflow, ci = ciWorkflow }, expected) {
  const errors = validateProductionWorkflow(deploy, ci, { checkLegacy: false });
  if (!errors.some((error) => error.includes(expected))) {
    throw new Error(`Negative fixture ${name} unexpectedly passed: ${errors.join('; ')}`);
  }
}

const deployWorkflow = read('.github/workflows/deploy-api-azure.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const errors = validateProductionWorkflow(deployWorkflow, ciWorkflow);
if (errors.length > 0) throw new Error(`Production workflows are missing required release controls:\n- ${errors.join('\n- ')}`);

const fixtures = [
  ['trusted repository guard', 'deploy', 'github.event.workflow_run.head_repository.full_name == github.repository', 'true', 'reject workflow_run events from forks'],
  ['least privilege', 'deploy', 'actions: read\n      contents: read', 'actions: write\n      contents: read', 'must not grant write permissions'],
  ['current main verification', 'deploy', 'if [ "$DEPLOY_SHA" != "$current_main" ]; then', 'if false; then', 'reject stale release SHAs'],
  ['successful CI verification', 'deploy', '.status == "completed" and\n            .conclusion == "success"', '.status == "completed" and\n            .conclusion != "success"', 'selected run succeeded'],
  ['exact artifact naming', 'ci', 'name: hoa-bff-${{ github.sha }}', 'name: hoa-bff-latest', 'exact commit SHA'],
  ['exact CI artifact run', 'deploy', 'run-id: ${{ steps.release.outputs.ci_run_id }}', 'run-id: ${{ github.run_id }}', 'selected exact successful CI run'],
  ['digest verification', 'deploy', 'sha256sum --check --strict', 'sha256sum --status', 'verify the CI artifact digest'],
  ['API DLL verification', 'deploy', '$publish_dir/HoaCommunityEvents.API.dll', '$publish_dir/removed.dll', 'verify the API DLL'],
  ['SPA entry verification', 'deploy', '$publish_dir/wwwroot/index.html', '$publish_dir/removed.html', 'verify the SPA entry point'],
  ['missing artifact failure', 'ci', 'if-no-files-found: error', 'if-no-files-found: warn', 'fail when files are missing'],
  ['artifact retention', 'ci', 'retention-days: 30', 'retention-days: 7', 'retained for 30 days'],
  ['database dependency', 'deploy', 'needs: prepare', 'needs: []', 'database_gate must depend on prepare'],
  ['deploy dependency', 'deploy', 'needs: [prepare, database_gate]', 'needs: prepare', 'depend on prepare and database_gate'],
  ['distinct database environment', 'deploy', 'name: production-database', 'name: production', 'distinct Environments'],
  ['deployment republish', 'deploy', 'run: echo "Database migration is an approved external release gate."', 'run: dotnet publish HoaCommunityEvents/backend/src/API/HoaCommunityEvents.API.csproj', 'must never republish'],
  ['deployment promotion', 'deploy', 'run: echo "Database migration is an approved external release gate."', 'run: az webapp deployment slot swap', 'must not swap or promote'],
  ['migration secret emptiness', 'deploy', 'if [ -z "$SQL_CONNECTION" ]; then', 'if false; then', 'reject an empty SQL secret'],
  ['canonical staging slot', 'deploy', 'slot-name: ${{ env.SLOT_NAME_CANONICAL }}', 'slot-name: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}', 'validated canonical slot'],
  ['action pinning', 'ci', 'uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262', 'uses: actions/checkout@v4', 'full 40-character commit SHA'],
  ['SQL secret scope', 'deploy', 'PUBLISH_PROFILE: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}', 'PUBLISH_PROFILE: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}\n          SQL_CONNECTION: ${{ secrets.AZURE_SQL_CONNECTION_STRING_PRODUCTION }}', 'staging validation must not receive the SQL secret'],
  ['actionlint schema check', 'ci', '.github/workflows/deploy-api-azure.yml', '.github/workflows/removed.yml', 'deployment workflow syntax'],
];

for (const [name, target, search, replacement, expected] of fixtures) {
  const workflow = target === 'deploy' ? deployWorkflow : ciWorkflow;
  const mutated = replaceRequired(workflow, search, replacement, name);
  expectInvalid(name, target === 'deploy' ? { deploy: mutated } : { ci: mutated }, expected);
}

expectInvalid('redirect smoke request', { deploy: replaceRequired(deployWorkflow, '--retry 12 --retry-all-errors', '--location\n            --retry 12 --retry-all-errors', 'redirect smoke request') }, 'must not follow redirects');
expectInvalid('HTML helper status enforcement', { deploy: replaceRequired(deployWorkflow, '[ "$status" != "200" ] || ', '', 'HTML helper status enforcement') }, 'require_html must directly reject non-200 responses');
expectInvalid('HTML helper doctype enforcement', { deploy: replaceRequired(deployWorkflow, "! grep -qi '<!doctype html' \"$response_file\"", 'true', 'HTML helper doctype enforcement') }, 'require_html must directly require <!doctype html');

console.log('Production workflow contract and all negative fixtures are valid.');
