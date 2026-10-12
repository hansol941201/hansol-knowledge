// Read-only deployment preflight. Tokens and secret values are never printed.
const auth = require('firebase-tools/lib/auth');
const project = 'hansol-knowledge-941201';
async function main() {
  const account = auth.getGlobalDefaultAccount();
  if (!account) { console.log(JSON.stringify({ project, loggedIn: false })); return; }
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  const request = async (url, body) => {
    const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    return response.ok ? data : { status: response.status, error: data.error?.message };
  };
  const permissions = ['cloudfunctions.functions.create', 'cloudfunctions.functions.update', 'cloudfunctions.functions.get', 'iam.serviceAccounts.actAs', 'serviceusage.services.enable', 'secretmanager.secrets.create', 'secretmanager.versions.add', 'secretmanager.versions.access', 'firebaserules.rulesets.create', 'firebaserules.releases.update', 'datastore.entities.get', 'datastore.entities.update'];
  const [info, billing, iam, functions, secret] = await Promise.all([
    request(`https://firebase.googleapis.com/v1beta1/projects/${project}`),
    request(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`),
    request(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`, { permissions }),
    request(`https://cloudfunctions.googleapis.com/v2/projects/${project}/locations/-/functions`),
    request(`https://secretmanager.googleapis.com/v1/projects/${project}/secrets/OPENAI_API_KEY`)
  ]);
  console.log(JSON.stringify({ project, account: account.user.email, info, billing, permissions: iam, missingPermissions: iam.permissions ? permissions.filter(p => !iam.permissions.includes(p)) : null, functions: functions.functions?.map(f => ({ name: f.name, state: f.state })) || functions, openaiSecret: secret.name ? { exists: true, name: secret.name } : secret }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
