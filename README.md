# Crispy Harvest Web App

This is the React Web version of your Crispy Harvest cookie ordering app.

## Setup

1. Open this folder in VS Code.
2. Put your images inside `public/img/` using these exact names:
   - `crispylogo.png`
   - `pistachio.jpg`
   - `kinderbueno.png`
   - `biscoff.jpg`
   - `cac.png`
   - `nutella.png`
3. Run:

```bash
npm install
npm run dev
```

4. Open the localhost link shown in the terminal.

## Firebase

Firebase is already connected in `src/firebaseConfig.js` using your project config.

Enable these in Firebase Console:

- Authentication → Sign-in method → Email/Password → Enable
- Authentication → Sign-in method → Google → Enable
- Firestore Database → Create database

## Firestore test rules

Use this while testing:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```
