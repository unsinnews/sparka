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


[x] Chat sharing
    [x] Improve visibility selector with a modal 
    [x] Shared chats should load from the db, even for unauthed users
        [x] Share link should be different from normal url link. It should load the conversation into the session of the viewer.



[x] Rate limiting based on IP

[x] Define project Name
[x] Define project styles
[x] Sign up with GitHub (auth block from shadcn)
    [x] Sign in panel is not aligned horizontally
[x] Update README.md
[x] Add Apache License




## Beta

[x] Sharing
    [x] Switch queries to public for shared chats 
    [x] Clone artifacts on message chat cloning, changing ownership
    [x] Update artifact save mutation to work locally
    [x] Clone attachments on message chat cloning, changing ownership
    [x] Apply the isShared flag to the MessageTreeProvider
    [x] Move the MessageTreeProvider back to the all routes layout level

[x] Anonymous users artifacts
    [x] Store documents locally for anonymous users
    [x] Enable the generate document tool


[x] Bug: Plus button doesn't change to home Sparka sometimes (after getting an artifact/error?)
[x] Bug: On mobile, Text and **spacing** in multimodal input footer should be smaller



[x] Model Selector should be a selectable list. The cards should be for a more detailed view (not used as often)


[x] Perf opt: Multimodal input should only update input value in a context (and maybe tools, attachments, etc). 
    [x] Decouple from chat so that typing experience can be faster
    [x] The edit message should have its own context
    [x] Attachements should be part of the Chat-input-context
    [x] Modified chat helpers are not needed. We should just pass append and reload to the multimodal input and add the selected model there


[ ] OG Image
[ ] Favicon
[ ] Revamp theme (color, borders, rounding, etc)



[ ] Replace input / ouput token pricing in model cards with credit pricing


[x] Anonymous message limits should be a number of credits.
    [x] The sggerver side should be the source of thruth for anonymous session credits
    [x] In use-chat-store, the useCredits query should use anonymous credits if unauthenticated
    [x] Fix message Limits consistency between backend and frontend
    [ ] Create a better toast message when backend reaches rate-limit


[x] Stop button in multimodal input not showing when streaming starts. It's showing only after clicking submit and before receiving the first token..

[x] When windows is not used for some time, and then you click on New Message + or Sparka, the route changes but the app doesn't (likely related to ChatIdProvider)
     [ ]  Race condition when changing to chatId when the response is streaming and we switch chat



[x] Try functionality and do easy fixes for the happy paths

[x] Chat history: 
- [x] Search Chats
- [x] Get Chat by id in chat-page.tsx



[x] Showing preview of last document in chat, should also consider updated document

[x] AI Tools Quality
    [x] Tool Descriptions should be all there's needed to know about the tool.
    [x] Get rid of getToolsPrompt
    [x] Improve tool description formats
    [x] Generate image tool is treated as a document, and tool thinks it's not able to use them

[ ] Optimizations
  [ ] Message depends on the whole chatHelpers, therefore it renders everytime a chunk is recevived

[x] Document alignment should be in the middle


[x] Images
    [x] Create with gpt-image-1
    [x] Images shouldn't be artifacts. They should be just a response.
       [x] Add gpt-image-1 to @all-models
    [x] Disable image generation for anonymous users ?


[x] Tools
    [x] Canvas should be a tool
    [x] Image generation should be a tool


[x] Last Model selected and used should be the new default model


## Polishing

[ ] Models
    [ ] Claude 3.7 reasoning not found
    [ ] Consuming thinking tokens as context for different model (xai -> anthropic) makes them invalid (https://github.com/vercel/ai/discussions/5480)

[ ] Images
    [ ] Image loading skeleton should have a nicer animation (like chatgpt). 
    [ ] Don't expose the prompt in the image result
    [ ] Image should have a download button
    [ ] It should be possible to display more than 1 image in the response (grid of 2 at certain sizes)
    [ ] Image should be expandable in a modal


[x] View Changes Button should be a toggle (should have a visible active state when active)

[ ] Chat history: 
- [ ] Favourite / Pinned chats
- [ ] Virtual list for previous chats


[ ] Generated artifact create a new version when they render on Lexical

[ ] Deep Research
    [x] Fix vercel timing out (Now  5m Max should be enough). Update the vercel.json and use Fluid Compute
    [ ] Background execution and resuming
    [ ] Use new OpenAI deep research models

[ ] Image as context for image generation (Blocked by AI SDK not having editImages function (to call openai edit images endpoint))
    [ ] There is a branch called `image-edits` with WIP code for this.
    [ ] Pass messages to the create-document tools (Stashed as "pass contextForLLM to document handlers")
    [ ] gpt-image-1 is able to interpret input images as context
    [ ] Move images from artifact to main thread


[ ] User Message ++
    [ ] The user message should just be MultiModalInput with "view" mode (or non editing)
    [ ] Pasted links in the prompt should have rich formatting (in both multimodal input and user message)
    [ ] Clicking on an attached image (in multimodal input or in message view) should expand the image in a modal 

[ ] Artifacts should use the selected model to generate the document

[ ] Get rid of deleteTrailingMessagesAsync or allow message deletion

[ ] Is last artifact detection in messages is more complex than needed.

[ ] Durable streams
    [x] Create a message-continues data part and call resume from the frontend
    [ ] Restore from the branch named `background-tasks`
    [ ] Fix tree Provider with resumed messages

[ ] Threads
    [ ] A chat request with parentMessageId, should return a stream that indicats whats the parentMesssageId for that request
    [ ] A resumed stream will try to append to any message in the chatId, regardless of the thread it's in. Maybe use the `stop` helper?
    [ ] Artifacts should belong to the current thread
    [ ] Combination of thread switching and resumable streams doesn't work reliably. The stream should have the last message Id and not just the chat

[ ] Optimize the MessageTreeProvider with a messageMap in a reference

[ ] MultiModalInput
    [ ] Migrate to Lexical (there is a background agent with part of the work)
    [ ] Use rich format for links
    [ ] Selected model should be part of the Chat-input-context
    [ ] Chat bottom row should not update on type
    [ ] The MultiiModal input shouldn't know about chatHelpers, it should get functions related to them from a provider

[ ] Copy code button is too close to language / filename top header

[ ] Retry Assistant message with a new model
    [ ] Model selected needs to be part of the message **info**
    [ ] Model needs to be part of the request data
    [ ] Current model that generated the message should be detailed in the message actions (like t3)

[ ] Create Non-thinking variants of models (e.g. Claude-4-Sonnet)
[ ] Dont scroll to bottom when switching branches
[x] Optimize the Model Selector component
    [x] with lazy loading 
    [x] With memoization

[ ] Nicer model icons (and include in selectable trigger), like in https://ai-sdk.dev/playground/s/YUzrs1RVBM7x




[ ] The HomePage and ChatPage should be the same component. Should be less code and allow nicer transitions.

[ ] Extended messages
    [ ] Each user message should save the selected model, data, etc.
    [ ] Each assistant message should save the model used to generate it

[ ] Reactive updates
    [ ] Build a stor fore Chat Input Provider so that it doesn't cause renders when unrelated parts of context changes
    [ ] getParentMessageID should be part of the MessageTreeProvider (store-like) and return the parent message based on a reference Map 
    [ ] Optimization: The message streaming re-renders the whole message conversation / chat

[x] When unauthed, the cookie should switch to default model if not in the free models
[x] Chat action buttons make smaller, remove borders
[x] Use image avatar from next-auth session

[ ] Change Sparka Google Oauth to Sparka AI

[ ] Code
    [ ] Extend code editing and syntax hihglighting to typescript
    [ ] Add run support for JavaScript / TypeSCript

[x] Image generation
    [x] Improve the tool description to make it more clear that it's an image generation tool

[ ] Perf optimization: On getQuery cache subscription, update the tree. Keep the message tree in a reference


[x] Create a menu in the assistant message actions to retry (creating a new branch)


[ ] BYOK (Bring Your Own Key)

[ ] MCP Support

[ ] Chat sharing
    [x] Artifacts sharing
    [ ] Add "Make this chat discoverable" option to share modal
    [ ] Add social media sharing buttons (LinkedIn, Reddit, X) to share modal

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
   [x] Artifacts handling for anonymous users
[ ] Response (errors) from stream route (/api/chat) should be in error stream data format

[ ] Images should be stored in a blob (and not in tool part results)

[ ] Optimize the number of getVotes query calls
[x] Why does visibility selector takes chat visibility as a prop?
[x] React Query Prefetch for the selected route
[ ] React Query Prefetch for the selected route with SSR

[ ] Migrate artifacts to ID + version or just ID as the main key

### Backend
[x] Create a button to Deep Research
[x] Write a chron job that deletes chatStream rows older than 24hs
[ ] Clearly define what's an update and what's a tool action in the backend, so that it can be used with more flexibility without changing frontend
[ ] Deep research should have a step in which it decides if the question can be answered or it should continue researching.
[ ] Unify Deep research and reasonSearch
[ ] Add manus-like plan as a document
[ ] Security: User should only be able to see their own chats.
[ ] Migrate routes to TRPC (and use it in the frontend)
[ ] Organize authorization as a layer at the beggining of each trpc procedure

[ ] Cleanup up the providers.ts file
[ ] Refactor Model, providers, modelCosts so that it's easier to add new models
[ ] Propagate model selection to deep research (and create new selectables for them)
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
[x] Only render last document as preview, others as pill
[ ] Migrate to tailwind 4 (and migrate container queries)

[ ] Reduce number of re-renders (memoization)
[ ] Open canvas button on navbar like chatgpt
[ ] Open canvas button like chatgpt


### System
[x] Get rid of API keys, just use the backend keys
[x] TBD Create limits per accounts with a few credits

[ ] Syntax Highlighting
[x] Image Generation Support
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

[ ] Migrate to Biome 2.0