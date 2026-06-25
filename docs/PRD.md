Here is a comprehensive Product Plan for the **"Leave Now" London Commute Oracle** Alexa Skill. This plan bridges the gap between high-level product strategy and the precise, modular implementation style that **Claude Code** excels at executing.

# **Product Plan: The "Leave Now" London Commute Oracle**

## **1\. Product Vision & Value Proposition**

The native Alexa transport feature provides static, generic estimations. The **Commute Oracle** is a hyper-local, context-aware voice utility for Londoners. It answers the high-anxiety question during a morning routine: *"When do I actually need to step out of the door to make my appointment, taking into account current Tube/Bus disruptions and my actual walking pace?"*

## **2\. Core Feature Scope**

| Feature | Description | MVP (Phase 1\) | Deepening (Phase 2\) |
| :---- | :---- | :---- | :---- |
| **Fixed Origin Routing** | Hardcoded home location coordinates passed to TfL. | X |  |
| **Dynamic Destination Slot** | Captures free-form spoken London locations via AMAZON.SearchQuery. | X |  |
| **Real-Time TfL Integration** | Hits /Journey/JourneyResults for live transit options. | X |  |
| **Disambiguation Voice Flow** | Handles multiple location matches (e.g., "Dishoom King's Cross" vs "Dishoom Covent Garden"). | X |  |
| **Smart Disruption Rerouting** | Automatically filters out routes with "Severe Delays" and offers the next fastest viable option. |  | X |
| **Custom Walking Buffers** | Configurable padding for the walk from the front door to the platform. |  | X |

## **3\. Technical Architecture & Data Flow**

The architecture is lightweight, event-driven, and designed for rapid local iteration before deploying to production.

* **Frontend:** Alexa Voice Service (AVS) Interaction Model.  
* **Backend:** Node.js (v18+) hosted on AWS Lambda (or local via ngrok for development).  
* **SDK:** @ask-sdk/core (Alexa Skills Kit SDK for Node.js).  
* **External API:** Transport for London (TfL) Unified API.

\[User Voice\] ──\> \[Alexa Cloud\] ──\> \[Ngrok / Lambda\] ──\> \[TfL API\]  
                                          │  
                                   (Logic & Filtering)  
                                          │  
\[User Hears\] \<── \[Alexa Cloud\] \<─── \[Clean Audio String\]

## **4\. Claude Code Implementation Roadmap**

To get the best results from Claude Code, the build is broken into highly decoupled, sequential milestones. Each milestone includes explicit **Acceptance Criteria** so you can easily verify Claude's output.

### **Milestone 1: Scaffolding & Environment Setup**

* **Objective:** Establish a clean, containerized, or local Node.js environment with all dependencies.  
* **Claude Code Action:** Initialize project, create package.json, configure .env handling, and set up a basic Express/ASK SDK local server.  
* **Acceptance Criteria:** Server starts locally without errors; .env.example contains placeholders for TFL\_APP\_ID and TFL\_APP\_KEY.

### **Milestone 2: Interaction Model Generation**

* **Objective:** Deploy the VUI (Voice User Interface) configuration.  
* **Claude Code Action:** Generate the JSON interaction model schema containing the GetTravelTimeIntent and the Destination slot utilizing AMAZON.SearchQuery.  
* **Acceptance Criteria:** A valid en-GB Alexa interaction model JSON file is generated and ready to paste into the Alexa Developer Console.

### **Milestone 3: TfL Service Layer**

* **Objective:** Build the data fetching engine.  
* **Claude Code Action:** Create a isolated tflService.js module using axios that accepts a destination string, resolves it against the TfL coordinates, and requests a journey from your fixed home location.  
* **Acceptance Criteria:** A standalone test script can successfully pull a JSON payload from the TfL API using mock inputs.

### **Milestone 4: Intent Handler & Disambiguation Logic**

* **Objective:** Connect the voice input to the data layer and handle fuzzy matching.  
* **Claude Code Action:** Write the GetTravelTimeIntentHandler. Include logic to parse the TfL searchByModeResults or dispatched locations. If TfL returns multiple choices, construct a speech prompt asking the user to clarify.  
* **Acceptance Criteria:** Alexa cleanly speaks the fastest route text if unambiguous, or asks *"Did you mean...?"* if multiple locations match.

### **Milestone 5: Disruption Filtering & Audio Synthesis**

* **Objective:** Make the skill "smart" by filtering out bad London transit days.  
* **Claude Code Action:** Implement payload parsing that looks for disruptions or status strings matching "Severe Delays". If found, skip that journey option and format the secondary option into a concise, natural phrase (e.g., *"The Northern line has severe delays, so instead, take the Piccadilly line from..."*).  
* **Acceptance Criteria:** Simulated API payloads with disruptions successfully trigger the fallback route in unit tests.

## **5\. Development Strategy with Claude Code**

When you open Claude Code in your repository terminal, pass it structured, localized context. Because you're testing an Alexa Skill locally, use this specific workflow:

1. **Iterate via Local Server:** Have Claude Code use the standard ASK SDK Express adapter so you can hit your local endpoint with tools like Postman or the Alexa Skill Code tester before dealing with AWS Lambda deployment.  
2. **Use Mock Payloads:** Because TfL API data changes second-by-second, have Claude generate a folder of mock TfL JSON responses (e.g., normal\_journey.json, disrupted\_journey.json, ambiguous\_destination.json) to guarantee your parsing logic is bulletproof.

Would you like to start by generating the prompt for Milestone 1 to hand directly to Claude Code, or should we refine the fixed home location handling first?