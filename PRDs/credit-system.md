## PRD: User Credit and Subscription System

**1. Introduction & Goals**

*   **Goal:** Implement a system to manage user credits. Users will receive an initial allocation upon signup and can purchase additional credits through subscription plans. This aims to monetize the service and provide users with flexible usage options.
*   **Background:** Currently, user accounts do not have a concept of credits or usage limits tied to payments. This feature introduces that mechanism.

**2. User Stories**

*   **New User:** As a new user signing up, I want to automatically receive a starting balance of credits so I can explore the platform's features immediately.
*   **Existing User:** As a user, I want to easily view my current credit balance within my account settings or dashboard so I know my remaining usage capacity.
*   **User Needing More:** As a user who has run out of or is low on credits, I want to be able to subscribe to a predefined plan to increase my credits so I can continue using the premium features.

**3. Requirements**

*   **Functional Requirements:**
    *   **Initial Credit Allocation:** A default number of credits must be automatically added to a user's account upon successful registration (managed via schema default or environment variable).
    *   **Credit Balance Display:** The user's current credit balance must be visible in their profile or a dedicated dashboard section.
    *   **Subscription Plans:** Define at least two subscription tiers (e.g., Free Tier - implied 0 credits/month after initial, Paid Tier 1, Paid Tier 2). Each tier should specify the number of credits granted per billing cycle (e.g., monthly) and the cost.
    *   **Payment Integration:** Integrate with a payment processor (e.g., Stripe) to handle subscription purchases and recurring billing.
    *   **Credit Top-up:** Upon successful payment confirmation (via webhook or similar mechanism), the corresponding number of credits must be added to the user's balance.
    *   **Credit Consumption:** Specific features/actions within the application must deduct credits from the user's balance. (Need to define *which* features consume credits and how many).
    *   **Insufficient Credits Handling:** Users attempting to use credit-consuming features without sufficient balance should be notified and potentially prompted to upgrade or purchase credits.
*   **Non-Functional Requirements:**
    *   **Reliability:** Credit transactions (allocation, deduction) must be atomic and reliable. Avoid race conditions or loss of credits.
    *   **Scalability:** The system should handle a large number of users and credit transactions efficiently.
    *   **Accuracy:** The displayed credit balance must always reflect the actual state accurately and promptly.

**4. Database Schema Changes (`lib/db/schema.ts`)**

*   **Modify `user` table:** Add an integer column to store the credit balance.
    ```typescript
    // lib/db/schema.ts
    import {
      pgTable,
      varchar,
      timestamp,
      json,
      uuid,
      text,
      primaryKey,
      foreignKey,
      boolean,
      integer // <-- Add integer import
    } from 'drizzle-orm/pg-core';

    export const user = pgTable('User', {
      id: uuid('id').primaryKey().notNull().defaultRandom(),
      email: varchar('email', { length: 64 }).notNull(),
      name: varchar('name', { length: 64 }),
      image: varchar('image', { length: 256 }),
      credits: integer('credits').notNull().default(100), // <-- Add credits column, default e.g. 100
    });

    // ... rest of the schema
    ```
*   **(Optional but Recommended) New `subscriptionPlan` table:** To manage plans dynamically.
    ```typescript
    // lib/db/schema.ts
    export const subscriptionPlan = pgTable('SubscriptionPlan', {
      id: varchar('planId').primaryKey(), // e.g., 'plan_basic', 'plan_pro', potentially Stripe Plan ID
      name: varchar('name', { length: 64 }).notNull(),
      price: integer('price').notNull(), // Store in cents
      creditsGranted: integer('creditsGranted').notNull(),
      interval: varchar('interval', { enum: ['month', 'year'] }).notNull(), // Or use Stripe interval strings
    });
    ```
*   **(Optional but Recommended) New `userSubscription` table:** To track user subscription status.
    ```typescript
    // lib/db/schema.ts
    export const userSubscription = pgTable('UserSubscription', {
      userId: uuid('userId').primaryKey().notNull().references(() => user.id),
      planId: varchar('planId').notNull().references(() => subscriptionPlan.id),
      stripeSubscriptionId: varchar('stripeSubscriptionId').unique(), // Store Stripe's ID
      status: varchar('status', { enum: ['active', 'canceled', 'incomplete', 'past_due'] }).notNull(), // Align with Stripe statuses
      currentPeriodEnd: timestamp('currentPeriodEnd').notNull(),
      createdAt: timestamp('createdAt').notNull().defaultNow(),
      updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    });
    ```

**5. Server Actions & Integration (Conceptual)**

*   **Get User Data (including credits):** Handled via server components or server actions accessing session/database data.
*   **List Plans:** Data fetched server-side (from DB or config) and passed to components, potentially via server actions if dynamic filtering is needed.
*   **Initiate Checkout:** A Server Action will be used to create a checkout session (e.g., with Stripe) and return the necessary details/URL to the client.
*   `POST /api/webhooks/stripe`: **(Still required)** Endpoint to receive events from Stripe (e.g., `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`) to update user credits and subscription status in the database.

**6. Future Considerations**

*   **Credit Expiration:** Implement logic for credits to expire after a certain period.
*   **Credit Types:** Differentiate between initial/free credits and purchased credits.
*   **One-Time Purchases:** Allow users to buy credit packs outside of subscriptions.
*   **Usage Tracking:** Detailed logging of credit consumption per feature/user. 