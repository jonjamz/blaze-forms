TemplatesForms.integrations = new TemplatesForms.decorators.Integratable({
  rendering: {
    createFormBlock: null,
    createFormElement: null
  },
  validation: {
    getSchemaInstance: null,
    validateField: null,
    hasInvalidFields: null
  }
});

TemplatesForms.integrations.decorate(TemplatesForms);