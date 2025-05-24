# PRD: Dynamic Credit Usage System

## 1. Goal

Implement a dynamic credit system where the cost of a user interaction depends on the selected AI model and the tools utilized during the response generation. This allows for fairer pricing based on computational resources consumed and provides mechanisms to manage user spending by restricting tool availability based on remaining credits.

## 2. Requirements

### 2.1. Model-Based Costing

- Each available AI model (`selectedChatModel`) will have a base credit cost associated with it.
- This cost is charged per successful message generation request initiated by the user.
- **Example Costs (Illustrative):**
  - `gpt-4o`: 1 credit
  - `dall-e-3`: 60 credits
  - `gpt-o1-preview`: 50 credits

### 2.2. Tool-Based Costing

- Certain tools will incur an additional credit cost when successfully executed during a response generation step.
- Costs should reflect the computational expense or value of the tool.
- **Example Costs (Illustrative):**
  - `webSearch`: +1 credit per execution
  - `deepResearch`: +3 credits per execution
  - `codeInterpreter`: +2 credits per execution
  - `getWeather`, `retrieve`, `stockChart`, etc.: +0 credits (or a minimal shared cost)

### 2.3. Pre-Generation Tool Filtering

- Before initiating the `streamText` call in `app/(chat)/api/chat/route.ts`, the system must check the user's current credit balance.
- A predefined minimum credit cost should be associated with each tool (e.g., `deepResearch` might require the user to have at least 5 credits available).
- The list of `activeTools` passed to `streamText` should be filtered to only include tools the user can potentially afford (considering the base model cost + potential tool cost).
- If the user cannot even afford the base cost of the selected model, the request should be rejected with a `402 Insufficient Credits` status before calling `streamText`.

### 2.4. Intra-Generation Tool Filtering (Multi-Step)

- Utilize the `experimental_prepareStep` callback within `streamText`.
- **Goal:** Prevent expensive tool usage mid-generation if the user's credits have been depleted by previous steps (model cost + prior tool executions).
- **Logic:**
  - Inside `experimental_prepareStep`, calculate the estimated cost incurred *so far* in the current multi-step generation (initial model cost + costs of tools executed in previous steps).
  - Calculate the user's *remaining* credits after subtracting the estimated cost so far.
  - Determine which tools are affordable given the remaining credits.
  - Return a potentially restricted list of tools via `experimental_activeTools` for the upcoming step. This prevents the model from attempting to call a tool the user can no longer afford.

## 3. Implementation Notes

- **Cost Definition:** Define model and tool costs in a centralized configuration, perhaps in `lib/config/credits.ts` or similar.
- **Tool Cost Mapping:** The `getTools` function in `lib/ai/tools/tools.ts` or the structure calling it might need modification to associate costs with tool names.
- **Filtering Logic:** Implement filtering logic in `app/(chat)/api/chat/route.ts` before the `streamText` call (for pre-generation filtering) and within the `experimental_prepareStep` callback (for intra-generation filtering).
- **Credit Deduction:** The primary credit deduction (base model cost + actual tool costs incurred) should happen reliably in the `onFinish` callback of `streamText`, ensuring atomicity or eventual consistency. Calculate the final cost based on the actual `toolResults` provided in `onFinish`.
- **User Feedback:** The frontend should ideally reflect which tools are unavailable due to insufficient credits, though this is out of scope for the backend implementation described here.

## 4. Open Questions

- What are the exact costs for each model and tool? (Needs definition)
