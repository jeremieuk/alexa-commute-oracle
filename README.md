# Commute Oracle — Alexa Skill

Tells you **when to leave home** to reach any London destination on time, using live TfL data and surfacing disruptions.

## Usage examples

> "Alexa, ask commute oracle how do I get to Canary Wharf"  
> "Alexa, ask commute oracle when do I need to leave to be at King's Cross by nine"  
> "Alexa, ask commute oracle set my home to SW9 8JH"

## Setup

### 1. TfL API key

Register at https://api.tfl.gov.uk/ to get a free `app_key`.

**Local dev:** copy `.env.example` → `.env` and fill in `TFL_APP_KEY`.

**Alexa-hosted prod:** open `lambda/config.js` and set `TFL_APP_KEY` to your key directly (the Alexa-hosted environment has no custom env-var UI). Add `lambda/config.js` to `.gitignore` if you prefer not to commit the key — but it is a low-sensitivity registered-app key, rate-limit scoped.

### 2. Privacy policy URL

Before certifying, replace the placeholder `privacyPolicyUrl` in `skill-package/skill.json` with a real hosted URL. The policy must cover:
- What data is collected (home postcode)
- How it is stored (DynamoDB, EU region)
- How users can delete it ("delete my home" intent)
- GDPR contact details

### 3. Local testing

```bash
cd lambda
npm install
npm test
```

### 4. Deploy (Alexa-hosted)

Alexa-hosted skills deploy via **git push** to CodeCommit — `ask deploy` is a no-op for hosted skills.

1. Create a new Alexa-hosted skill in the Alexa Developer Console (Node.js runtime).
2. Clone the provisioned CodeCommit repo.
3. Copy this project's files into the clone.
4. `git push` — the build pipeline deploys automatically.

To import the interaction model: Developer Console → Interaction Model → JSON Editor → paste `skill-package/interactionModels/custom/en-GB.json`.

### 5. Rotation note

If the TfL key needs rotating, update `lambda/config.js` and push. As an alternative to committing the key, write it to the Alexa-hosted S3 bucket and read at cold start — see `util/persistence.js` for the bucket name env var.

## Architecture

```
Voice → Alexa cloud → Alexa-hosted Lambda (Node 16)
                              │
              ┌───────────────┼───────────────┐
         Device Address    DynamoDB        TfL API
         API (postcode)  (saved home)   (journeys)
              └───────────────┼───────────────┘
                      disruptionFilter
                      speechFormatter
                              │
                    ← spoken SSML response
```

## GDPR / data deletion

- Users say **"delete my home"** at any time to wipe their stored postcode.
- On skill disable, the `SKILL_DISABLED` event fires the Lambda, which calls `deleteHome()`.

## Deferred

- Custom walking buffers
- APL / Echo Show visual cards
- Multi-locale beyond `en-GB`
