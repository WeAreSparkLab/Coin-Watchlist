# Coin Watchlist

A single-file watchlist for coins you're researching: what you paid, how far
it's moved since, and where it trades.

`index.html` is the whole app — no build step, no dependencies. Open it
locally or serve this folder from any static host.

Data lives in your browser (localStorage). Optional cloud backup keeps a copy
in your own Supabase project; keys are stored in your browser only and are
never written into the page.

## Setup

There is no build step and no `.env` file.

1. Open `index.html` locally, or serve the folder from any static host.
2. The page ships a default Supabase project URL and **anon/public** key (`DEFAULT_PROJECT_URL` / `DEFAULT_ANON_KEY`). That key is designed to be public; data is protected by Row Level Security (RLS), not by hiding the key.
3. To use your own backend, replace those two constants (or use the in-app cloud panel) with values from Supabase -> Project Settings -> API. Never commit a `service_role` / secret key.
