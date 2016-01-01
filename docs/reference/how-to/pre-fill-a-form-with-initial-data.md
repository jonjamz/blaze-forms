## How-To Guides

### Pre-Fill a Form With Initial Data

Pass data into the Form Block and it will automatically be inserted into the Form Elements
by field:

```javascript
Template.fullName.helpers({
  getData: function () {
    return {firstName: 'Jon', lastName: 'James'};
  }
});

```

```handlebars
<template name="fullName">
  {{#basicFormBlock data=getData schema=getSchema action=getAction}}
    {{> nameInput field='firstName'}}
    {{> nameInput field='lastName'}}
  {{/basicFormBlock}}
</template>
```

In order for this to work properly, your Element template must support external data insertion
using the `value` template helper.

```handlebars
<template name="nameInput">
  <input placeholder={{instructions}} class="reactive-element" value={{value}}>
  {{#if submitted}}
    {{#if errorMessage}}<p class="error-message">{{errorMessage}}</p>{{/if}}
  {{/if}}
</template>
```
