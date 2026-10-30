# Authentication & OTP API Documentation

## Overview

This API enables user authentication via email and OTP (One-Time Password).  
It supports sending OTP to email, verifying OTP, and registering customer profiles.

---

## Endpoints

### 1. Send OTP to Email

**POST** `/email/send-otp`

Sends an OTP code to the specified email address.

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Response

```json
{
  "message": "OTP sent successfully"
}
```

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
```

#### Response

```json
{
  "message": "OTP verified successfully",
  "data": {
    "isNewUser": false,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "User Name",
      "avatarUrl": "https://ui-avatars.com/api/?name=User+Name",
      "phoneNumber": "08123456789",
      "role": "customer",
      "createdAt": "2024-07-20T12:34:56.789Z",
      "updatedAt": "2024-07-20T12:34:56.789Z"
    }
  }
}
```

If the user profile is not completed:

```json
{
  "message": "OTP verified successfully",
  "data": {
    "isNewUser": true
  }
}
```

#### Cookies Set

- `accessToken`: JWT access token (httpOnly)
- `refreshToken`: JWT refresh token (httpOnly)

#### Errors

- `401 Unauthorized`: OTP is invalid or expired

---

### 3. Register Customer Profile

**POST** `/auth/register-customer-profile`

Completes the user profile after OTP verification.

#### Request Body

```json
{
  "email": "user@example.com",
  "fullName": "User Name",
  "phoneNumber": "08123456789"
}
```

#### Response

```json
{
  "message": "OTP verified successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "avatarUrl": "https://ui-avatars.com/api/?name=User+Name",
    "phoneNumber": "08123456789",
    "role": "customer",
    "createdAt": "2024-07-20T12:34:56.789Z",
    "updatedAt": "2024-07-20T12:34:56.789Z"
  }
}
```

#### Cookies Set

- `accessToken`: JWT access token (httpOnly)
- `refreshToken`: JWT refresh token (httpOnly)

#### Errors

- `404 Not Found`: Email not registered (OTP verification required first)

---

## Error Codes

| Code | Description                        |
| ---- | ---------------------------------- |
| 400  | Invalid request or validation      |
| 401  | Unauthorized (invalid/expired OTP) |
| 404  | Not found (email not registered)   |
| 500  | Internal server error              |

---

## Notes

- OTP is valid for 5 minutes.
- OTP is sent via email using a Handlebars template.
- JWT tokens are set as httpOnly cookies for security.
- User profile must be completed after OTP verification for full access.

---

## Example Flow

1. **User enters email** → `/email/send-otp`
2. **User receives OTP via email**
3. **User enters OTP** → `/auth/verify-otp`
   - If new user, prompted to complete profile
4. **User completes profile** → `/auth/register-customer-profile`
5. **User receives JWT tokens in cookies**

---
