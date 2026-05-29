# Airtable Schema

This document describes the Airtable base layout the Suppliers Automation
Engine targets. In Phase 1 the Airtable API route is a placeholder — these
tables do not need to exist yet, but this is the intended structure so Phase 2
can wire the real integration without redesign.

Each intake form maps to one table. The form `slug` (in
`src/lib/forms.ts`) is used as the table name in the `POST /api/airtable`
payload.

All tables share an implicit `Created` timestamp and an Airtable record id.

---

## Table: `supplier-onboarding`

| Field        | Type            | Notes                                        |
| ------------ | --------------- | -------------------------------------------- |
| companyName  | Single line     | Required                                     |
| contactName  | Single line     | Required                                     |
| email        | Email           | Required                                     |
| phone        | Phone           | Required                                     |
| website      | URL             |                                              |
| category     | Single select   | Materials / Equipment / Logistics / Services / Other |
| taxId        | Single line     |                                              |
| notes        | Long text       |                                              |

## Table: `product-catalog`

| Field        | Type            | Notes                       |
| ------------ | --------------- | --------------------------- |
| supplierName | Single line     | Required                    |
| sku          | Single line     | Required                    |
| productName  | Single line     | Required                    |
| unitPrice    | Number (USD)    | Required                    |
| moq          | Number          | Minimum order quantity      |
| leadTimeDays | Number          |                             |
| description  | Long text       |                             |

## Table: `quote-request`

| Field         | Type           | Notes                                  |
| ------------- | -------------- | -------------------------------------- |
| requesterName | Single line    | Required                               |
| email         | Email          | Required                               |
| item          | Single line    | Required                               |
| quantity      | Number         | Required                               |
| neededBy      | Date           |                                        |
| urgency       | Single select  | Standard / Expedited / Critical        |
| details       | Long text      |                                        |

## Table: `purchase-order`

| Field        | Type            | Notes                          |
| ------------ | --------------- | ------------------------------ |
| poNumber     | Single line     | Required                       |
| supplierName | Single line     | Required                       |
| buyerEmail   | Email           | Required                       |
| totalAmount  | Number (USD)    | Required                       |
| currency     | Single line     | Defaults to USD                |
| deliveryDate | Date            |                                |
| lineItems    | Long text       | One item per line: SKU x qty   |

## Table: `invoice-submission`

| Field         | Type           | Notes                  |
| ------------- | -------------- | ---------------------- |
| invoiceNumber | Single line    | Required               |
| supplierName  | Single line    | Required               |
| poNumber      | Single line    | Required (links to PO) |
| amount        | Number (USD)   | Required               |
| invoiceDate   | Date           | Required               |
| dueDate       | Date           |                        |
| remarks       | Long text      |                        |

## Table: `support-ticket`

| Field         | Type           | Notes                          |
| ------------- | -------------- | ------------------------------ |
| submitterName | Single line    | Required                       |
| email         | Email          | Required                       |
| supplierName  | Single line    |                                |
| priority      | Single select  | Low / Medium / High / Urgent   |
| subject       | Single line    | Required                       |
| description   | Long text      | Required                       |

---

## Integration notes

- The `POST /api/airtable` route currently echoes the payload and returns a
  placeholder `recordId`. Phase 2 will replace this with a call to
  `https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{table}` authenticated with
  `AIRTABLE_API_KEY`.
- Field names in `src/lib/forms.ts` are kept identical to the Airtable column
  names above so the form payload can be forwarded as the record `fields`
  object without remapping.
