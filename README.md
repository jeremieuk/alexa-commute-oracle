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

The live skill is `amzn1.ask.skill.59e49501-48bf-4840-97c1-453d46cec95c` (en-GB,
development stage, Node 16). To deploy from a clean machine using the ASK CLI:

1. `ask configure --no-browser` (one Login-with-Amazon).
2. `ask init --hosted-skill-id <skillId>` — clones the CodeCommit repo and wires the
   git credential helper.
3. Copy this project's `lambda/` + `skill-package/` into the clone, add the TfL key to
   the clone's `lambda/config.js` (private repo only), and `git push origin master`.
4. Watch the build: `ask smapi get-skill-status --skill-id <skillId>`.
5. Enable for testing once: `ask smapi set-skill-enablement --skill-id <skillId> --stage development`.
6. Test from the terminal: `ask smapi invoke-skill --skill-id <skillId> --endpoint-region EU --skill-request-body <json>`.

**Non-obvious gotchas (all hit during the first deploy):**

- **`ask-sdk-model` must be a direct dependency.** `ask-sdk-core` declares it only as a
  `peerDependency`, and the hosted build's npm does not auto-install peers — without it
  every request fails at runtime with `Cannot find module 'ask-sdk-model'`.
- **Keep `lambda/` deploy-only.** No `devDependencies` (jest etc.), no `package-lock.json`,
  no stray files (`util.js` requiring an undeclared `aws-sdk`) — these broke the hosted
  build. Tests live in this source repo, not in the deployed Lambda.
- **Manifest `permissions` and `targetedRegions` can't be set via SMAPI/git** (both 400 /
  fail the build). The device-address permission must be toggled in the console
  Permissions tab. Until then, do **not** emit an `AskForPermissionsConsent` card — Alexa
  rejects any response requesting consent for an undeclared permission ("invalid response").
  The skill is voice-set-home first and works without the permission.
- **`jest@30` requires Node ≥18**; pin `jest@^29` for Node-16 parity if you run tests in
  an environment matching the hosted runtime.

To import the interaction model manually instead: Developer Console → Interaction Model →
JSON Editor → paste `skill-package/interactionModels/custom/en-GB.json`.

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
