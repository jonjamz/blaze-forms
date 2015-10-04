var utils = TemplatesForms.utils;

/**
 * Might be better if this was a class where it could be instantiated with an existing instance.
 */

function getSchemaInstance() {

}

// Like we have it now, where they pass in a SimpleSchema instance?
function setSchemaInstance() {

}

function validateField() {

}

function isInvalid() {

}

TemplatesForms.integrations.integrate('validation', {
  getSchemaInstance: getSchemaInstance,
  validateField: validateField,
  isInvalid: isInvalid
});