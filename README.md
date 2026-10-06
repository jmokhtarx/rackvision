# RackVision Website

The RackVision website presents the company’s technical infrastructure services and provides a contact form for project inquiries. It is a lightweight, responsive static site built with HTML, CSS, and vanilla JavaScript.

## Features

- Company overview, services, industries, project gallery, careers, and contact information
- Responsive navigation and layouts for mobile and desktop
- Light and dark appearance options
- Motion effects that respect the visitor’s reduced-motion preference
- Contact form integration with Google Apps Script, Google Sheets, and email notifications

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and site content |
| `styles.css` | Main layout and visual styles |
| `brand.css` | Brand, theme, and interface refinements |
| `app.js` | Navigation, theme control, motion effects, and contact form behavior |
| `contact-config.js` | Configurable Google Apps Script web app endpoint |
| `favicon.svg` | RackVision browser icon |
| `apps-script/Code.gs` | Google Apps Script backend for form submissions |
| `apps-script/SubmissionResult.html` | Apps Script response page used by the form iframe |
| `apps-script/README.md` | Detailed backend setup and verification guide |

## Run locally

The site has no build step or package installation. From the project folder, start a static file server:

```powershell
python -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173). Keep the project files together so the relative CSS, JavaScript, and favicon paths resolve correctly.

If Python is unavailable, use any static HTTP server. Opening `index.html` directly may prevent the contact form and some browser features from working as expected.

## Deploy

Publish the contents of this folder to a static web host, with `index.html` at the site root. No server-side runtime is needed for the website itself. Keep the Apps Script backend deployed separately; see [`apps-script/README.md`](apps-script/README.md) for setup and verification.

For a GitHub Pages deployment, publish the repository’s root directory from the chosen branch. After enabling hosting, open the published URL and check the site on both desktop and mobile widths.

## Contact form and data flow

The browser submits the form to the `/exec` URL configured in `contact-config.js`. The Google Apps Script backend validates the fields, appends the inquiry to the configured Google Sheet, and emails a notification to `rackvision1@gmail.com`.

The endpoint URL is public frontend configuration, not a password or credential. The Apps Script web app must allow public submissions for visitors who are not signed in to Google. Anyone who discovers the endpoint can attempt to submit data, so monitor the receiving inbox and spreadsheet for unwanted submissions. The script does not return the spreadsheet’s contents.

Never put Gmail passwords, OAuth tokens, service account keys, spreadsheet sharing links, or other credentials in this repository. Keep the Sheet private and share it only with people who need access. Google authorization and spreadsheet configuration belong in the Apps Script account, not in the website source.

## External assets

The page loads Manrope and DM Mono from Google Fonts and gallery images from Unsplash. An internet connection is needed to load these remote assets. Replace illustrative gallery images with RackVision-owned project images when available, and confirm usage rights before publishing project photography.

## Content and contact details

The current site lists RackVision’s email, phone numbers, location, working hours, and social accounts in the contact section and footer. Review these details before publishing to confirm they are the public business contacts you want visitors to see.
