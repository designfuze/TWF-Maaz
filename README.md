# Tabasheer Welfare Foundation — Talent Hunt Examination

Production-ready Vercel frontend connected to the existing Google Apps Script backend.

## Architecture

Student → Vercel `index.html` → `/api/twf` → Google Apps Script `/exec` → Google Sheets / Drive / Gmail

## Repository structure

```text
tabasheer-talent-hunt/
├── index.html
├── vercel.json
├── .env.example
├── .gitignore
├── README.md
├── api/
│   └── twf.js
└── google-apps-script/
    └── Code.gs
```

## Google Apps Script

1. Open the existing Tabasheer Google Apps Script project.
2. Replace its `Code.gs` with `google-apps-script/Code.gs` from this repository.
3. Make sure the Apps Script is bound to the same Google Spreadsheet containing the application/management sheets.
4. Run `setupProject()` once from the Apps Script editor.
5. Authorize Google Sheets, Drive and Gmail permissions.
6. Deploy as a Web App.
7. Execute as: **Me**.
8. Who has access: **Anyone**.
9. Copy the `/exec` URL.

## Vercel

Create an environment variable named `GAS_WEB_APP_URL` and set it to the Apps Script `/exec` URL.

Example:

```env
GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Do not use `/dev`.

## Deploy

Push this folder to a new GitHub repository and import the repository into Vercel. No build command is required. The site is a static `index.html` with a Vercel serverless API.

After changing environment variables, redeploy the project.

## API actions

- `health`
- `getFormConfig`
- `getBrandAssets`
- `submitApplication`
- `getAdmitCardStatus`
- `getAdmitCard`
- `checkResult`

The frontend does not use `google.script.run`; that API is only available inside Google Apps Script HTML Service.

## Google Sheets

The Apps Script manages:

- Applications
- Admit Card Management
- Result Management
- Exam Settings

Admit Card publication is controlled by `Admit Card Live?`. Result publication is controlled by `Result Live?`. The examination date is controlled by `Exam Settings!B2`.
