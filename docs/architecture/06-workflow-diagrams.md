# 06 — Workflow Diagrams

End-to-end and per-module workflows. All diagrams are Mermaid (render on GitHub).

---

## 1. Master Lifecycle (Lead → Traveller)

```mermaid
flowchart TD
    A[Lead Captured<br/>omnichannel] --> B{Duplicate?}
    B -- yes --> B1[Link / Merge<br/>dedupe]
    B -- no --> C[Auto-create Lead]
    B1 --> C
    C --> D[Auto-Assign<br/>round-robin / team / destination]
    D --> E[Lead Management<br/>stages + timeline]
    E --> F[AI Enrichment<br/>summarize · extract · score]
    F --> G[Quotation(s)<br/>versioned, sent]
    G --> H{Customer Decision}
    H -- Rejected --> H1[Capture rejection reason] --> E
    H -- Accepted --> I[Sales Confirmed<br/>create Booking]
    I --> J[Handover to Operations]
    J --> K[Hotel Procurement]
    K --> L[Transport Procurement]
    L --> M[Voucher Generation]
    M --> N[Final Itinerary]
    N --> O[Customer Delivery<br/>portal + email]
    O --> P[Payments Collected<br/>advance → final]
    P --> Q[Travel Reminder]
    Q --> R[Feedback Request]
    R --> S[Analytics & AI Insights]
```

## 2. Lead Capture & Deduplication

```mermaid
flowchart TD
    subgraph Sources
        W[Website / Landing / Form]
        FB[FB / IG Lead Ads]
        GG[Google Lead Forms]
        WA[WhatsApp]
        MN[Manual Entry]
    end
    W & FB & GG & WA --> WH[/Webhook or /capture endpoint/]
    MN --> API[POST /leads]
    WH --> V{Verify signature<br/>+ source secret}
    V -- invalid --> X[Reject + log]
    V -- valid --> RAW[Persist integration_event]
    RAW --> NRM[Normalize payload<br/>phone E.164, email]
    API --> NRM
    NRM --> DUP{Dedupe check<br/>phone/email/fuzzy}
    DUP -- match --> LNK[Attach to existing lead<br/>+ record dedupe_match]
    DUP -- new --> NEW[Create lead]
    NEW --> ASG[Assignment Engine]
    LNK --> ACT[Append timeline activity]
    ASG --> ACT
```

### Assignment Engine

```mermaid
flowchart TD
    A[New Lead] --> R{Match assignment_rule<br/>by priority}
    R -- destination rule --> D[Pick team/user for destination]
    R -- team rule --> T[Assign to team queue]
    R -- round-robin --> RR[Next user from pool cursor]
    R -- load-balanced --> LB[User with fewest open leads]
    R -- none --> UN[Unassigned pool]
    D & T & RR & LB --> N[Set assigned_user/team<br/>notify + reminder]
```

## 3. Lead Stage Machine

```mermaid
stateDiagram-v2
    [*] --> New
    New --> Contacted
    Contacted --> Interested
    Interested --> QuotationSent
    QuotationSent --> Negotiation
    Negotiation --> FollowUp
    FollowUp --> Negotiation
    Negotiation --> Confirmed
    QuotationSent --> Confirmed
    Interested --> FollowUp
    FollowUp --> Confirmed
    New --> Lost
    Contacted --> Lost
    Interested --> Lost
    Negotiation --> Lost
    QuotationSent --> Lost
    FollowUp --> Lost
    Confirmed --> Cancelled
    Lost --> [*]
    Cancelled --> [*]
    Confirmed --> [*]: handover to Operations
```
Transitions to `Lost`/`Cancelled` require a reason (feeds AI loss analytics). `Confirmed` triggers
booking creation + ops handover.

## 4. AI Assistant Pipeline

```mermaid
sequenceDiagram
    participant SRC as New message/call
    participant API as API
    participant Q as ai.* queues
    participant W as Worker
    participant P as AIProvider (OpenAI/Gemini)
    participant DB as DB

    SRC->>API: message/call stored
    API->>Q: enqueue ai.summarize / ai.extract / ai.score
    Q->>W: job
    W->>DB: load lead conversation/call context
    W->>P: prompt (summarize / extract / score)
    P-->>W: structured JSON
    W->>DB: upsert ai_insight + ai_extracted_requirement
    W->>DB: update lead.priority / lead.score (hot lead)
    W->>API: emit ai.insight.created → timeline + notify
```
Extraction targets: **destination, travel date, budget, adults, children, hotel preference, flight
requirement, special requests**. Scoring outputs a 0–100 conversion probability and a hot-lead flag.

## 5. WhatsApp Sync

```mermaid
flowchart TD
    IN[/webhooks/whatsapp/] --> SIG{Verify HMAC}
    SIG -- ok --> EVT[Persist integration_event]
    EVT --> Q[whatsapp.in queue]
    Q --> P[Process message]
    P --> CONV{Conversation exists?}
    CONV -- no --> NL{Known lead by phone?}
    NL -- no --> CL[Auto-create lead]
    NL -- yes --> UL[Use lead]
    CONV -- yes --> UC[Use conversation]
    CL & UL --> MC[Create/Update conversation]
    UC --> MC
    MC --> MED{Has media?}
    MED -- yes --> S3[Download → S3 → file]
    MED -- voice --> TR[Queue voice transcription]
    MED -- no --> MSG[Store message]
    S3 --> MSG
    TR --> MSG
    MSG --> TL[Timeline + AI summary trigger]
```
Outbound: template messages via `whatsapp.out` queue with delivery-status callbacks updating `message.status`.

## 6. Call Management

```mermaid
sequenceDiagram
    participant T as Exotel/Knowlarity
    participant WH as /webhooks/telephony
    participant API as API
    participant Q as call.* queues
    participant S3 as Storage
    participant AI as AIProvider

    T->>WH: call event (ringing/answered/completed)
    WH->>API: persist call + integration_event
    T->>WH: recording ready (URL)
    WH->>Q: enqueue fetch recording
    Q->>S3: download → store as file (against lead)
    Q->>AI: transcribe + summarize
    AI-->>Q: transcription + summary
    Q->>API: update call.transcription/summary → timeline
```

## 7. Quotation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Sent: send (email + portal)
    Sent --> Viewed: customer opens
    Viewed --> Accepted
    Viewed --> Rejected
    Sent --> Accepted
    Sent --> Rejected
    Sent --> Expired: valid_until passed
    Viewed --> Expired
    Draft --> Draft: new version (revision_count++)
    Accepted --> [*]: create Booking
    Rejected --> [*]: capture reason
    Expired --> [*]
```
Each lead may hold multiple quotations; each quotation holds multiple versions (revisions). Accept
triggers booking + ops handover; reject/expire feeds AI rejection analytics.

## 8. Itinerary Integration

```mermaid
sequenceDiagram
    participant U as Staff
    participant API as API
    participant ITB as Itinerary Builder
    participant DB as DB

    U->>API: POST /itinerary/import (external_id)
    API->>ITB: fetch itinerary
    ITB-->>API: payload
    API->>DB: store itinerary + itinerary_version (normalized)
    U->>API: link version to quotation
    Note over API,ITB: Webhook on builder update
    ITB->>API: /webhooks/itinerary (changed)
    API->>DB: new itinerary_version (synced_at)
    API->>U: notify "itinerary updated"
```

## 9. Operations Pipeline

```mermaid
flowchart LR
    C[Confirmed] --> H[Hotel Procurement]
    H --> T[Transport Procurement]
    T --> V[Voucher Generation]
    V --> F[Final Itinerary]
    F --> D[Customer Delivery]
    D --> X[Completed]
    C -.->|cancel| K[Cancelled]
```
Each stage spawns `operation_task` checklist items assigned to ops executives; stage advances only when
its required tasks are `done`. Every action is timeline-logged and audited.

### Vendor Procurement (per hotel/transport)

```mermaid
flowchart TD
    A[Need: hotel/transport] --> B[Select vendor + rate card]
    B --> C[Send rate request<br/>vendor_communication]
    C --> D{Vendor responds}
    D -- quoted --> E[Record quote]
    E --> F{Approve?}
    F -- yes --> G[Confirm booking<br/>status=confirmed + conf no]
    F -- renegotiate --> C
    G --> H[Generate vendor/hotel/transport voucher]
```

## 10. Payment Flow

```mermaid
sequenceDiagram
    participant U as Staff/Customer
    participant API as API
    participant GW as Razorpay/Cashfree
    participant WH as /webhooks/{gw}
    participant DB as DB

    U->>API: create payment (advance/partial/final)
    API->>GW: create order
    GW-->>API: order id
    API-->>U: checkout (portal/link)
    U->>GW: pay
    GW->>WH: payment.captured (signed)
    WH->>DB: verify → update payment=paid
    DB->>API: emit payment.captured
    API->>DB: update invoice (amount_paid/status)
    API->>U: receipt PDF + email automation
```
Statuses: `pending → partial → paid`, plus `refunded` / `cancelled` / `failed`. Manual/cash/bank
payments are recorded directly (no gateway), still generating receipts.

## 11. Voucher & PDF Generation

```mermaid
flowchart TD
    A[Generate voucher request] --> B[Assemble data snapshot<br/>booking + hotel/transport]
    B --> C[Queue voucher.pdf job]
    C --> D[Render HTML template<br/>tenant branding]
    D --> E[Headless Chromium → PDF]
    E --> F[Upload to S3 → file]
    F --> G[Link pdf_file_id, status=generated]
    G --> H[Optional send: email/WhatsApp/portal]
```
Same pipeline produces customer vouchers, hotel/transport/vendor vouchers, invoices, and receipts.

## 12. Email Automation

```mermaid
flowchart TD
    EV[Domain event] --> M{Matching automation rule?}
    M -- no --> Z[skip]
    M -- yes --> D[Apply delay_minutes + conditions]
    D --> R[Render template + variables]
    R --> Q[email queue]
    Q --> S[SMTP/provider send]
    S --> L[email_log: sent/failed/bounced/opened]
```
Triggers: quotation sent, payment received, invoice generated, voucher generated, travel reminder,
feedback request.

## 13. Customer Portal (OTP)

```mermaid
sequenceDiagram
    participant C as Customer
    participant API as Portal API
    participant CH as SMS/WhatsApp/Email

    C->>API: request-otp (phone)
    API->>CH: send OTP (hashed, TTL, rate-limited)
    C->>API: verify-otp
    API-->>C: portal access token (scope=portal)
    C->>API: GET /portal/quotations | invoices | vouchers
    API->>API: check portal_access_grant
    API-->>C: data + signed download URLs
```

## 14. Audit Trail (cross-cutting)

```mermaid
flowchart LR
    ACT[Any mutating action] --> INT[Audit Interceptor]
    INT --> CAP[Capture actor, action,<br/>resource, before/after, IP, UA]
    CAP --> Q[audit queue]
    Q --> W[Append to audit_log<br/>partitioned, append-only]
```
Captured actions: created, updated, deleted, assigned, transferred, status/payment/quotation updated,
login/logout, export, permission change.
