Package.describe({
  name: 'templates:forms',
  summary: 'Dead easy reactive forms with validation.',
  version: '2.0.0',
  git: 'https://github.com/meteortemplates/forms.git'
});

Package.onUse(function(api) {

  api.versionsFrom('METEOR@1.0');

  api.use([
    'templating',
    'tracker',
    'check',
    'reactive-var',
    'underscore'
  ], 'client');

  api.use([
    'check'
  ], 'server');

  api.use('aldeed:simple-schema@1.5.2');
  api.imply('aldeed:simple-schema');

  // Templates
  api.addFiles('templates/defaultFormBlock.html', 'client');
  api.addFiles('templates/examples/basicForm.html', 'client');
  api.addFiles('templates/examples/basicFormBlock.html', 'client');
  api.addFiles('templates/examples/basicInput.html', 'client');

  // Extensions
  api.addFiles('extensions/simple-schema.js');

  // Library
  api.addFiles('src/helpers.js', 'client');
  api.addFiles('src/module.js', 'client');

  // Setup
  api.addFiles('init.js', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('templates:forms');
  api.addFiles('tests/basic.js');
});
