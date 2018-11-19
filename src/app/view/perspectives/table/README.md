# Table perspective

Table can be used both as a full-featured perspective and an embedded table in any other perspective.

## Embedded table

In order to embed table in your component, you need to import `TablePerspectiveModule` in your module and the add it to your template like this:

```html
<table-perspective [tableId]="'myUseCase'" [query]="{collectionIds:['5af6b48744c8b8266bb4d7e8']}"></table-perspective>
```

It needs two input parameters:

- `tableId`: unique identifier across the application (do not use `default` as it is reserved for the table in a table perspective)
- `query`: query with a single collection and possibly other conditions to filter only relevant documents

There is also an optional input parameter:

- `config`: table configuration (rows order, columns order and width, etc.)
