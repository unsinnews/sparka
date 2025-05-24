## PRD: User Credit System (MVP)

**1. Introduction & Goals**

*   **Goal:** Implement a basic system to manage user credits for MVP. Users will receive an initial allocation upon signup. This provides a foundation for future monetization.
*   **Background:** Currently, user accounts do not have a concept of credits. This feature introduces the basic mechanism.

**2. User Stories (MVP)**

*   **New User:** As a new user signing up, I want to automatically receive a starting balance of credits so I can use the platform's core features immediately.
*   **Existing User:** As a user, I want to easily view my current credit balance within my account settings or dashboard so I know my remaining usage capacity.

**3. Requirements (MVP)**

*   **Functional Requirements:**
    *   **Initial Credit Allocation:** A default number of credits must be automatically added to a user's account upon successful registration (managed via schema default or environment variable).
    *   **Credit Balance Display:** The user's current credit balance must be visible in their profile or a dedicated dashboard section.
    *   **Credit Consumption:** Specific features/actions within the application must deduct credits from the user's balance. (Need to define *which* features consume credits and how many for MVP).
    *   **Insufficient Credits Handling:** Users attempting to use credit-consuming features without sufficient balance should be notified and the action should be blocked.
*   **Non-Functional Requirements:**
    *   **Reliability:** Credit allocation/deduction must be reliable.
    *   **Accuracy:** The displayed credit balance must always reflect the actual state accurately and promptly.

**4. Database Schema Changes (`lib/db/schema.ts`) (MVP)**

*   **Modify `user` table:** Add an integer column to store the credit balance.
    ```typescript
    // lib/db/schema.ts
    import {
      // ... other imports
      integer // <-- Add integer import
    } from 'drizzle-orm/pg-core';

    export const user = pgTable('User', {
      // ... other fields
      credits: integer('credits').notNull().default(100), // <-- Add credits column, default e.g. 100
    });
    ```

**5. Server Actions & Integration (Conceptual) (MVP)**

*   **Get User Credits:** Handled via server components or server actions accessing session/database data when needed (e.g., displaying in UI).
*   **Credit Check/Deduction:** Implemented within Server Actions associated with specific features (e.g., the action for sending a message will check/deduct credits before proceeding).

**6. Future Considerations (Post-MVP)**

*   Subscription Plans & Payments (Stripe Integration)
*   Credit Top-up
*   Detailed Usage Tracking
*   Credit Expiration
*   One-Time Purchases
*   Admin Panel for Plan Management 