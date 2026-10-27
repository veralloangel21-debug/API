# VioletCart - React Native API Activity

A simple Expo Router + TypeScript application using the DummyJSON Products API.

## Activity requirements covered

- **GET** - retrieves products and retrieves a single product
- **POST** - creates a new product with `POST /products/add`
- **PATCH** - updates an existing product with `PATCH /products/:id`
- **DELETE** - deletes an existing product with `DELETE /products/:id`
- Uses React Native `fetch()`
- Loading and error handling
- Search and category menu
- Product detail view
- Rating and customer review comments
- Full product/API response display with the `meta` field removed

> DummyJSON simulates POST, PATCH, and DELETE. Those changes are not permanently stored on the DummyJSON server. The app also updates local React state so the result can still be demonstrated on screen.

## Run the project

Clone:

```powershell
git clone https://github.com/veralloangel21-debug/API.git
cd API
```

Install:

```powershell
npm install
```

Start Expo:

```powershell
npx expo start
```

With an Android Studio emulator already running, press:

```text
a
```

## Main files

```text
src/
└── app/
    ├── _layout.tsx
    └── index.tsx
```

The complete activity is in `src/app/index.tsx`.
