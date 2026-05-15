const fs = require('fs');
const path = require('path');

test('workflow PWA expose les variables Supabase au build', () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, '..', '..', '.github', 'workflows', 'deploy-pwa.yml'),
    'utf8',
  );

  expect(workflow).toContain('EXPO_PUBLIC_SUPABASE_URL: ${{ vars.EXPO_PUBLIC_SUPABASE_URL }}');
  expect(workflow).toContain('EXPO_PUBLIC_SUPABASE_KEY: ${{ secret.EXPO_PUBLIC_SUPABASE_KEY }}');
  expect(workflow).toContain('EXPO_PUBLIC_APP_URL: ${{ vars.EXPO_PUBLIC_APP_URL }}');
  expect(workflow).toContain('npx expo export --platform web');
});

test('.env.example documente les variables publiques sans vraie cle', () => {
  const envExample = fs.readFileSync(path.join(__dirname, '..', '..', '.env.example'), 'utf8');
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '..', '.gitignore'), 'utf8');

  expect(envExample).toContain('EXPO_PUBLIC_SUPABASE_URL=');
  expect(envExample).toContain('EXPO_PUBLIC_SUPABASE_KEY=');
  expect(envExample).toContain('EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/');
  expect(envExample).not.toContain('frmiyddfipejirtbzoxr.supabase.co');
  expect(envExample).not.toContain('sb_publishable_');
  expect(gitignore).toContain('.env');
});
