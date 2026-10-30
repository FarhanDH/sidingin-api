# Orders API Documentation

## Overview

This API enables user with role:

- Customer:
  - Create new order

---

## Endpoints

### 1. Create New Order

**POST** `/orders`

Create a new order with specified data.

#### Request Body: application/json

```json
{
  "acProblems": ["string"],
  "serviceLocation": "string",
  "propertyTypeId": "string",
  "propertyFloor": "integer",
  "acUnits": [
    {
      "acTypeId": "string",
      "pk": "string",
      "brand": "string",
      "quantity": "integer"
    }
  ],
  "serviceDate": "string (ISO 8601 format, e.g., 2024-12-31T17:00:00.000Z)",
  "note": "string (optional)"
}
```

#### Response

`200 Created`: Order created successfully.

```json
{
  "message": "Order created successfully",
  "data": {
    "id": "uuid-string-of-new-order",
    "status": "pending",
    "serviceLocation": "Jl. Jenderal Sudirman No. 123",
    "serviceDate": "2024-12-31T17:00:00.000Z",
    "note": "string" | undefined,
    "customer": {
      "id": "uuid-of-customer",
      "fullName": "Budi Santoso"
    },
    "acUnits": [{ "acTypeName": "AC Split", "pk": "1 PK", "quantity": 2 }]
  }
}
```

`400 Bad Request`: Request body is missing or invalid.

````json
{
  "message": [
    "location must be a string",
    "acUnits must be an array",
    "acUnits.0.quantity must be a positive number"
  ],
  "error": "Bad Request",
  "statusCode": 400
}

#### Errors

- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Failed to send OTP

---

### 2. Verify OTP

**POST** `/auth/verify-otp`

Verifies the OTP code sent to the user's email.
If successful, returns user data and JWT tokens (set as cookies).

#### Request Body

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
````

`401 Unauthorized`: If user not authorized..
`403 Forbidden`: If user role not allowed to access this endpoint.
