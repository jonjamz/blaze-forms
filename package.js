Package.describe({
  name: 'templates:forms',
  summary: 'Dead easy reactive forms with validation.',
  version: '1.13.1',
  git: 'https://github.com/meteortemplates/forms.git'
});

Package.onUse(function(api) {

  api.versionsFrom('METEOR@1.0');

  api.use([
    'templating',
    'tracker',
    'check',
    'reactive-var',
    'underscore',
    'coffeescript'
  ], 'client');

  api.use([
    'check',
    'coffeescript'
  ], 'server');

  api.use('aldeed:simple-schema@1.3.0');
  api.imply('aldeed:simple-schema');

  // Templates
  api.addFiles('templates/defaultFormBlock.html', 'client');
  api.addFiles('templates/basicFormBlock.html', 'client');
  api.addFiles('templates/basicForm.html', 'client');
  api.addFiles('templates/basicInput.html', 'client');

  // Lib
  api.addFiles('lib/extensions/simple-schema.coffee');
  api.addFiles('lib/helpers.coffee', 'client');
  api.addFiles('lib/module.coffee', 'client');
  api.addFiles('lib/init.coffee', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('templates:forms');
  api.addFiles('tests/basic.js');
});
