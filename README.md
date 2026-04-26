# Peoples_Bill_of_Reverse_Burden
A civic tech project to crowdsource and refine a “Reverse Burden” Bill for Ghana’s Parliament. The web platform gathers citizen input and uses AI to update the draft in real time, expanding participation and strengthening the bill by identifying and closing potential loopholes.

## Admin access setup

- Backend bootstrap uses these environment variables when initializing the default admin account:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_EMAIL`
- Run `python database.py` after setting them to create the account if it does not already exist.

## Vercel admin UI bypass (temporary)

- Set `NEXT_PUBLIC_BYPASS_ADMIN_AUTH=true` in your Vercel environment variables to bypass the admin sign-in gate for UI preview only.
- Remove this value (or set to `false`) for real deployments.
