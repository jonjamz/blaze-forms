Package.describe({
  name: 'templates:forms',
  summary: 'Dead easy reactive forms with validation.',
  version: '1.7.0',
  git: 'https://github.com/meteortemplates/forms.git'
});

Package.onUse(function(api) {

  api.versionsFrom('METEOR@1.0');

  api.use([
    'templating',
    'tracker',
    'check',
    'underscore',
    'coffeescript'
  ], 'client');

  api.use([
    'check',
    'coffeescript'
  ], 'server');

  api.use('aldeed:simple-schema@1.2.0');
  api.imply('aldeed:simple-schema');

  api.addFiles('simple-schema.coffee');
  api.addFiles('templates:forms.coffee', 'client');
  api.addFiles('templates:forms.html', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('templates:forms');
  api.addFiles('templates:forms-tests.js');
});
