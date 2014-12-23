Package.describe({
  name: 'templates:forms',
  summary: 'Dead easy reactive forms with validation.',
  version: '1.0.1',
  git: 'https://github.com/meteortemplates/forms.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  api.use([
    'templating',
    'tracker',
    'check',
    'coffeescript',
    'aldeed:simple-schema@1.2.0'
  ], 'client');
  api.addFiles('simple-schema.coffee');
  api.addFiles('templates:forms.coffee');
  api.addFiles('templates:forms.html');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('templates:forms');
  api.addFiles('templates:forms-tests.js');
});
