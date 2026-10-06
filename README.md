# RackVision contact form: Google Apps Script setup

The site is static. This Apps Script web app receives the form POST, appends one
row to a Google Sheet, and emails the inquiry to `rackvision1@gmail.com`. No
Gmail password, OAuth token, or private credential belongs in the website code.

## Create and authorize the backend

1. Sign in to the Google account that should own the inquiry spreadsheet and
   receive the notifications, then create a new project at
   [Google Apps Script](https://script.google.com/).
2. Replace the starter `Code.gs` with `apps-script/Code.gs` from this project.
3. Add an HTML file named `SubmissionResult` and paste in
   `apps-script/SubmissionResult.html`.
4. In the Apps Script editor, choose and run `setupRackVisionContact` once.
   Review Google's permission prompt. This creates the `RackVision Website
   Inquiries` spreadsheet and stores its ID in Script Properties. Open the
   execution log to get the spreadsheet URL.
5. Choose **Deploy → New deployment → Web app**. Set **Execute as** to your
   account and **Who has access** to **Anyone** so public website visitors can
   submit without signing into Google. Google documents these web-app access
   and execution settings in its [Web Apps guide](https://developers.google.com/apps-script/guides/web).
6. Deploy, approve the authorization prompt, and copy the deployed URL ending
   in `/exec` (not the `/dev` test URL).
7. Paste that URL into `contact-config.js` as the value of
   `window.RACKVISION_CONTACT_ENDPOINT`, then publish the site files.

The web app must be publicly reachable to accept anonymous website submissions.
It only accepts validated form fields; it does not return spreadsheet contents.
The form also includes a honeypot field and a short duplicate-submission window.

## End-to-end verification

1. Open the deployed site and submit a clearly labeled test inquiry using
   non-sensitive test details.
2. Confirm the new row appears in the `Inquiries` tab.
3. Confirm `rackvision1@gmail.com` receives **New RackVision Website Inquiry**
   with all seven requested fields.
4. Confirm the website shows success only after Apps Script reports that both
   the Sheet write and email send completed. If either fails, the form keeps its
   values and shows an error so the visitor can retry.

Do not treat the integration as live until all four checks pass. `MailApp`
requires authorization by the account running the script; see Google's
[MailApp reference](https://developers.google.com/apps-script/reference/mail/mail-app).
