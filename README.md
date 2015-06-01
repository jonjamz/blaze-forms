# templates:forms

A minimalist Meteor package for creating reusable forms and form elements, with support for
reactivity, validation, and submission (including complex workflows).

Compatible with Bootstrap and other UI frameworks.

This package uses [aldeed:simple-schema](https://github.com/aldeed/meteor-simple-schema) for field validation.

#### Comparison with aldeed:autoform

[aldeed:autoform](https://github.com/aldeed/meteor-autoform) and templates:forms serve different purposes:
- **aldeed:autoform** automatically generates insert and update forms for your collections.
It is a large and rich package, tightly integrated with aldeed:simple-schema and aldeed:collection2.
- **templates:forms** only provides a thin framework for building reusable forms, form elements and form workflows.

#### Installation

```sh
$ meteor add templates:forms
```

<br />
## Examples

### Minimal Usage: Check That It Works!

templates:forms comes with two predefined basic components, `basicFormBlock` and  `basicInput`, so that you can quickly see the package in action:

```html
<template name="createNews">
  <h4>Create a News</h4>
  {{#basicFormBlock schema=getShema action=getAction}}
    {{> basicInput field="title"}}
    {{> basicInput field="body"}}
    <button type="submit" disabled="{{#if form.invalidCount}}disabled{{/if}}">Submit</button>
  {{/basicFormBlock}}
</template>
```
```javascript
Template.createNews.helpers({

  getSchema: function() {
    return new SimpleSchema({
      title: { type: String, max: 3 },
      body:  { type: String, max: 20, optional: true }
    });
  },

  getAction: function() {
    return function(els, callbacks, changed) {
      console.log('---------  News Submitted!  ---------');
      console.log('Fields:', this);
      callbacks.success();
    };
  }
});
```

### Simple Usage: Define Your Own Form Element

Create a form element:

```html
<template name="myInput">
  <input class="reactive-element" value="{{value}}">
  <p>{{#unless valid}}{{errorMessage}}{{/unless}}</p>
</template>
```

Or a richer version, using Bootstrap for example:

```html
<template name="myInput">
  <div class="form-group {{#unless valid}}has-error{{/unless}}">
    <label class="control-label">{{label}}</label>
    <input class="form-control reactive-element" value="{{value}}">
    <p class="help-block">{{#unless valid}}{{errorMessage}}{{/unless}}</p>
  </div>
</template>
```

Register your form element:
```javascript
TemplatesForms.registerElement({
  template: 'myInput',
  validationEvent: 'keyup',
  reset: function (el) {
    $(el).val('');
  }
});
```

Create your form:
```html
<template name="updateNews">
  <h4>Update a News</h4>
  {{#basicFormBlock schema=getSchema data=currentNews action=getAction}}
    {{> myInput field="title"}}
    {{> myInput field="body"}}
    <button type="submit" disabled="{{#if form.invalidCount}}disabled{{/if}}">Submit</button>
  {{/basicFormBlock}}
</template>
```

```javascript
Template.newsForm.helpers({

  getSchema: function () {
    // Return the schema used in a collection2 (see package aldeed:collection2)
    return News.simpleSchema();
  },

  getAction: function () {
    var newsId = this.currentNews._id;
    return function(els, callbacks, changed) {
      if (!_.isEmpty(changed))
        News.update(newsId, changed);
      callbacks.success();
    }
  }
});
```

### Advanced Usage: Define Your Own Form Block

Create a form block:
```html
<!--
  Use this template like this:
    {{#bootstrapModal modalId=... modalTitle=... schema=... data=... action=...}}
-->
<template name="bootstrapModal">
  <div class="modal fade" id="{{modalId}}">
    <div class="modal-dialog">
      <div class="modal-content">
        <form>
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title">{{modalTitle}}</h4>
          </div>
          <div class="modal-body">
            {{> UI.contentBlock data=data form=form}}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" disabled="{{#if invalidCount}}disabled{{/if}}">Save</button>
          </div>
        </form>
      </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
  </div><!-- /.modal -->
</template>
```
Notice that the form block must contain the `UI.contentBlock` line with the proper fields, so just copy it as shown.

Register your form block:
```javascript
TemplatesForms.registerFormBlock({
  template: 'bootstrapModal',
  submitType: 'normal'
});
```

Create your form:
```html
<template name="updateNews">
  {{#bootstrapModal modalId="updateNews" modalTitle="Update News" schema=getShema data=currentNews action=getAction}}
    {{> myInput field="title"}}
    {{> myInput field="body"}}
  {{/bootstrapModal}}
</template>
```

Use your form:
```html
<!-- Button trigger modal -->
<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#updateNews">Update</button>

<!-- Modal -->
{{> updateNews currentNews=currentNews}}
```

### Expert Usage: Complex Workflow

[View the Live Example](http://forms-example.meteor.com/)

Built with Bootstrap 3 and the `sacha:spin` package, it demonstrates how flexible and extensible this package is.

<br />
## Reference

### How-To Guides

In-depth guides covering specific use cases.

- [Provide a Reset Function for a Custom Element](docs/reference/how-to/provide-a-reset-function-for-a-custom-element.md)
- [Reset a Form Block and All Its Elements](docs/reference/how-to/reset-a-form-block-and-all-its-elements.md)
- [Pre-Fill a Form With Initial Data](docs/reference/how-to/pre-fill-a-form-with-initial-data.md)
- [Handle Reactive Changes to Initial Data](docs/reference/how-to/handle-reactive-changes-to-initial-data.md)
- [Use the Same Action Function for Inserts and Updates](docs/reference/how-to/use-the-same-action-function-for-inserts-and-updates.md)
- [Maximize Reusability with Nested Elements](docs/reference/how-to/maximize-reusability-with-nested-elements.md)
- [Extend Simple-Schema for Better Use With Forms](docs/reference/how-to/extend-simple-schema-for-better-use-with-forms.md)

### API Reference

Low-level guides covering advanced usage and capabilities.

- [Form Blocks](docs/reference/api/FormBlocks.md)
- [Form Elements](docs/reference/api/FormElements.md)
- [Action Function](docs/reference/api/ActionFunction.md) (Submit handling)

### Examples

Example code with annotations.

- **Form Blocks**
  - [Basic With Submit Button and Messaging](docs/reference/examples/form-blocks/basic-with-submit-button-and-messaging.md)
  - [Hide Submit Button Until Valid](docs/reference/examples/form-blocks/hide-submit-button-until-valid.md)
- **Form Elements**
  - Basic:
    - [Text Input](docs/reference/examples/form-elements/basic/TextInput.md)
    - [Textarea](docs/reference/examples/form-elements/basic/Textarea.md)
    - [Select (Drop-down)](docs/reference/examples/form-elements/basic/Select.md)
    - [Date Selector](docs/reference/examples/form-elements/basic/DateSelector.md)
  - Advanced:
    - [File Uploader](docs/reference/examples/form-elements/advanced/FileUploader.md)
    - [Select (Multi)](docs/reference/examples/form-elements/advanced/MultiSelect.md)
    - [Adjustable Number of Inputs](docs/reference/examples/form-elements/advanced/AdjustableNumberOfInputs.md)
    - [Date and Time](docs/reference/examples/form-elements/advanced/DateAndTime.md)

#### Get Involved

To report an error in the reference material, or if you would like to add your own example or guide,
please create an issue.

<br />
Contributors
------------

* [Jon James](http://github.com/jonjamz)

> Special thanks to [steph643](https://github.com/steph643) for significant testing and review.

My goal with this package is to keep it simple and flexible, similar to core packages.

As such, it may already have everything it needs.

**Please create issues to discuss feature contributions before creating a pull request.**
