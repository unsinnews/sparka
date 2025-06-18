## MVP

[x] Show reasoning tokens in the UI
[x] Only launch with Deep Research (Disable reason search)
[x] Verify that backend doesn't timeout for this flow
[x] MultiModal Input refinement
- [x] Attachments should be removable
- [x] Message attachments should be inside message box when visualizing and editing
- [x] Attachments should work with drop zone
[x] Fix reserved credit release on crash
[x] Please wait until the message repsonse ends
[x] Create / Edit document should have more context of the conversation than a description
[x] Document should have a messageId reference and that should be used to make it publicly visible when the chat changes visibility to public
[x] Delete previous chat messages should also delete documents created / updated in that range of the conversation
[x] When I switch providers in the edit message box, I loose the message editing content. It doesn't change the model
[x] Something is limiting the width (Maybe Messages, or multimodal-input) and therefore this doesn't work on mobile
[x] useScrollToBottom activates when scrolling up. What do we do on artifacts?
[x] Rename chat title
[x] Use scroll to bottom scrolls when hovering different parts of the messages display
[x] Bug: On mobile the multimodal input loads with small width and then becomes full width.
[x] Scroll area sidebar chat history
[x] Scroll area artifacts
[x] Resumable streams
[x] Feat: Improve model selector with combobox and filters (based on features)
[x] Why does it reload the page when I change the model?
[x] Multimodal Input
    [x] After sending a message the input box remains at the last height, it should be reset to the default height
    [x] Sometimes the multimodal input keeps stale messages (experiment to find exactly in which scenarios)
    [x] Improve multimodal input styles for long text
    [x] Scrollbar
[x] PDF models
[x] Add Gemini

[x] Restore model selector

[x] Cleanup YourUIMessage, DBMessage, AnonymousMessage, Message, UIMessage

[x] Branching
    [x] User Message Edits should start a new branch
    [x] Allow user to switch branches in the UI
    [x] For thread switching, use setMessages from useChat


[x] Switch to client side navigation (like next-faster)
   [x] Switch routes with react router instead of reloading site for them


[ ] Chat sharing
    [ ] Improve visibility selector with a modal 
    [x] Shared chats should load from the db, even for unauthed users
        [x] Share link should be different from normal url link. It should load the conversation into the session of the viewer.
    [ ] Artifacts sharing



[x] Rate limiting based on IP

[ ] Define project Name
[ ] Define project styles
[ ] Sign up with GitHub (auth block from shadcn)
    [ ] Sign in panel is not aligned horizontally
[ ] Update README.md

[ ] Try functionality and do easy fixes for the happy paths


## Polishing
[ ] Dont scroll to bottom when switching branches
[ ] Prefetch chats in the background (the ones loaded in history)
[ ] Optimize the Model Selector component
    [ ] with lazy loading 
    [ ] With memoization

[ ] Anonymous message limits should be a number of credits.
    [ ] Increment message count for anyonymous on asssitant message finish
   [ ] Fix message Limits consistency between backend and frontend
       [ ] Disable send button when users reached the limit
       [ ] Create a better tooltip message when backend reaches rate-limit

[x] When unauthed, the cookie should switch to default model if not in the free models
[x] Chat action buttons make smaller, remove borders
[x] Use image avatar from next-auth session


[ ] Code
    [ ] Extend code editing and syntax hihglighting to typescript
    [ ] Add run support for JavaScript / TypeSCript

[ ] Image generation
    [ ] Improve the tool description to make it more clear that it's an image generation tool

[ ] Artifacts should belong to the current thread
[ ] Combination of thread switching and resumable streams doesn't work reliably. The stream should have the last message Id and not just the chat
[ ] Perf optimization: On getQuery cache subscription, update the tree. Keep the message tree in a reference


[ ] Create a menu in the assistant message actions to retry (creating a new branch)


[ ] The useDeleteChat hook should use trpc, and have an optimistic mutation
[ ] Should generate title be on user message or on assistant message? At the moment it's on user for anonymous and on assistant for authenticated

[ ] More Gemini models

[x] Demo without logging in
   [x] /chat/[id] should load for cookies for unauthenticated users
   [x] deleteTrailingMessages should be in chat store and implemented for anonymous too
   [x] Model selector should have non-anonymous models disabled
   [x] Move useSwr from visibility into a context
   [x] Display remaining messages in the chat, with a sign to login to reset the limit
   [x] Reduce anonymous message limit to 10
   [ ] Artifacts handling for anonymous users (how to support images, etc). Maybe tools are only for logged users
[ ] Response (errors) from stream route (/api/chat) should be in error stream data format

[ ] Optimize the number of getVotes query calls
[ ] Why does visibility selector takes chat visibility as a prop?
[ ] Get Chat by id in chat-page.tsx
[ ] React Query Prefetch for the selected route


### Backend
[x] Create a button to Deep Research
[x] Write a chron job that deletes chatStream rows older than 24hs
[ ] Clearly define what's an update and what's a tool action in the backend, so that it can be used with more flexibility without changing frontend
[ ] Deep research should have a step in which it decides if the question can be answered or it should continue researching.
[ ] Unify Deep research and reasonSearch
[ ] Add manus-like plan as a document
[ ] Security: User should only be able to see their own chats.
[ ] Migrate routes to TRPC (and use it in the frontend)
[ ] Organize authorization as a layer at the beggining of each trpc

[ ] Refactor Model, providers, modelCosts so that it's easier to add new models
[ ] Propagate model selection to deep research / reason tools (and create new selectables for them)
[ ] Save file uploads in Blob with non-public access
[ ] Deleting a chat should delete all the images and PDFs uploaded to blobs
[ ] Create a layer to coordinate queries (db related) and other funcions (e.g. blob deletion)


### Frontend
[x] Annotations for search should be less granular, just a list of sites (like perplexity)
[x] Migrate to TRPC with Tanstack Query
[ ] Get model from cache in model selector while loading
[x] Edit message should have multimodal input box (instead of only Send and Cancel)****
[x] When viewing shared chat from another user, vote is not allowed. The button is hidden but we are doing the request anyway
[x] Multimodal edit message to wide on mobile (is it using a min-width?)
[x] The multimodal input footer toggles dont fit the screen in artifact view. Should turn into a menu
[x] Artifact editing should be disabled on shared chats (isEditable is false)
[x] Only show the last artifact in the chat as a big preview, others as pills
[x] Multimodal input on artifact should be hidden in shared chat
[ ] Only render last document as preview, others as pill
[ ] Migrate to tailwind 4 (and migrate container queries)
[ ] Chat history: 
- [ ] Search Chats
- [ ] Virtual list for previous chats
[ ] Reduce number of re-renders (memoization)
[ ] Open canvas button on navbar like chatgpt
[ ] Open canvas button like chatgpt


### System
[x] Get rid of API keys, just use the backend keys
[x] TBD Create limits per accounts with a few credits

[ ] Syntax Highlighting
[ ] Image Generation Support
[ ] Chat Branching
    [ ] Chat should be forkable (even shared ones)

[ ] Add more providers (Google, Deepseek, etc)

[ ] AI SDK 5 ?
[ ] Implement credit budget handling to disalbe tools that can't be on each step by using prepareStep from AI SDK 5
[ ] Fix broken CI workflows
[ ] Long running jobs
    [ ] Restore deep research for reasoning models once we can go longer than 1m in request time.
[ ] Offer model variants without reasoning (for the ones that can be run with or without reasoning)
[ ] Optiomize all-models by only using allImplementedModels. Needs to propagate discriminated unions typing correctly
[ ] Model definitions need more flexibility (or model variants). E.g. google provider have different tiers size, reasoning, etc

