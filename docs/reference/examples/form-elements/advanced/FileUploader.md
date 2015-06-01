## Examples - Form Elements

### File Uploader

Use async validation features to prevent form from submitting until file(s) have uploaded.

This example uses [Filepicker.io](http://filepicker.io) service to upload.

```handlebars
<template name="fileElement">
  Add Files: <input type="file" class="reactive-element">
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'fileElement',
  validationEvent: 'change',
  validationValue: function (el, clean, template) {
    var self = this;
    var activeUploads = e.target.files.length;
    var uploads = {};
    var addFile = function (file) {
      var session = Random.id();

      // Add file to current uploads.
      uploads[session] = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: '' // Added once upload completes.
      };

      filepicker.store(file,

        // On success.
        function (InkBlob) {
          uploads[session].url = InkBlob.url;
          activeUploads--;
          if (activeUploads === 0) {
            // Send files to form data context.
            this.validate(uploads);
          }
        },

        // On error.
        function (FPError) { /* Do something to handle errors */ },

        // On progress.
        function (progress) { /* Do something to show progress... */ }
      );
    };

    for (file in e.target.files) {
      addFile(file);
    }

    // Return stopper to prevent sending `undefined` to validation.
    return self.stop;
  }
});
```