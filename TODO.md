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


[x] OG Image
[x] Favicon
[x] Revamp theme (color, borders, rounding, etc)
[x] Readme Update



[x] Models
    [x] Claude 3.7 reasoning not found
    [x] Consuming thinking tokens as context for different model (xai -> anthropic) makes them invalid (https://github.com/vercel/ai/discussions/5480)

[x] Bug bashing
    [x] Document Edits append instead of replacing (the clear instruction doesn't seem to work with lexical)
    [x] Share is broken (https://www.beta.sparka.ai/share/93e2bf85-163b-4a74-adbb-7a5504dcb0e5)
    [x] Retry mechanism doesn't work. Conversation is messed up
    [x] Create a better toast message when backend reaches rate-limit
    [x] Race condition when changing to chatId when the response is streaming and we switch chat


[x] Anonymous message limits should be a number of credits.
    [x] The sggerver side should be the source of thruth for anonymous session credits
    [x] In use-chat-store, the useCredits query should use anonymous credits if unauthenticated
    [x] Fix message Limits consistency between backend and frontend


[x] Stop button in multimodal input not showing when streaming starts. It's showing only after clicking submit and before receiving the first token..

[x] When windows is not used for some time, and then you click on New Message + or Sparka, the route changes but the app doesn't (likely related to ChatIdProvider)



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

[x] Small tasks
    [x] The Multimodal input submit should be disabled when attachments are being uploaded (submit with enter)



## 1.0.0

[x] Sparka Shared chat redirects to login

[x] Fix anonymous user creating doc

[x] Pinned chats
    [x] Schema: Create setIsPinned as a placeholder procedure in `chat.router.tsx`
    [x] Add the isPinned prop to the UIChat type in ui.ts and update the message-conversion for responses in chat.router.tsx
    [x] Create a mutation to update the chat isPinned property in `queries.ts` and use it in chat.router.tsx `setIsPinned` procedure
    [x] Create a pin button from `lucide-react` in `sidebar-chat-item.tsx` to display next to the menu in each chat item. When pin button is clicked in `sidebar-chat-item.tsx`, call the mutation to update the chat (tanstack query + trcp). On mutation settle, invalidate the chats query
    [x] Display pinned chats in a new category in the sidebar history (at the top)
    [x] move mutation to use-chat-store and create support for anonymous users
    [x] Do an optimistic update for the pinned chats

[x] Usage improvements
    [x] Move login to a more visibile place (like chatgpt). Leave previous place for the CTA
    [x] More space between buttons in multimodal input (hard to click on mobile)
    

[x] AI SDK 5 migration

[x] Bug: How do I enter on mobile? Enter is sumbit. Maybe we should do ctrl+enter for submit
[x] Bug: Mobile sidebar is collapsed view (when opened)
[x] Bug: Image model shouldnt be on model selector
[x] All sendMessage operations should have metadata
[x] Bug: A message sent in a thread, gets appended with null parent 

[x] Move getLastMessageId to the chatStore

[x] The message tree seems not to be getting the correct parent  WTF. RElated to ^



[x] Optimize the number of getVotes query calls

[x] Lexical editor doesn't show the cursor when the text is empty
[x] Higher maximum height on lexical editor (lexical-chat-input.tsx)

[x] Performance Optimizations
    [x] Optimize the MessageTreeProvider with a messageMap in a reference
    [x] Use store correctly so that only the message being streamed is updated
    [x] getParentMessageID should be part of the MessageTreeProvider (store-like) and return the parent message based on a reference Map 
    [x] Optimization: The message streaming re-renders the whole message conversation / chat
    [x] Lexical editor should hold the input state, no need to replicate it in the chat input provider. We can hold the lexical editor ref in the chat input provider.


[x] Lexical editor submit on enter sometimes adds the enter to the message


[ ] Tokens
    [ ] Protecting against going over token context


## Backlog

[ ] Anthropic limits are too low. Get from other provider or open-router.


[ ] Migrate to Next.js Router for navigation (And get rid of react-router)
    [ ] Basic migration
    [ ] App router optimization
       [ ] Apply learnings from next-faster
       [ ] Link prefetching and ppr have a problem. Prefetching causes an error 500 and page reloads.
       [ ] Do we really need to windows history push on sidebar-chat-item?
       

[ ] The HomePage and ChatPage should be the same component. Should be less code and allow nicer transitions.
[ ] Anonymous chats should not have the same page segment as authenticated chats. (they are trying to load an authenticated chat now)


[ ] Deep Research and estimation based on model cost

[ ] Deep Research v2
    [x] Fix vercel timing out (Now  5m Max should be enough). Update the vercel.json and use Fluid Compute
    [ ] Update deep research architecture to https://blog.langchain.com/open-deep-research
    [ ] Background execution and resuming
    [ ] Use new OpenAI deep research models

[ ] Deep research should have a step in which it decides if the question can be answered or it should continue researching.
[ ] Unify Deep research and reasonSearch



[ ] Agent Tool (like ChatGPT)
    [ ] Browser with GUI / Sandbox (Browserbase Operator / e2b Surf) 
        [ ] Screen as image input
        [ ] Stagehand is great for browser navigation without a computer use model
            [ ] Stagehand agent seems quite capable
        [ ] Browserbase MCP could be a quick PoC integration
        [ ] Sandbox (e2b-desktop or similar) for more power and control
        [ ] Vercel Sandbox https://ship-25-agents-workshop.vercel.app/docs/sandbox
    [ ] Text browser (Scraping)
    [ ] Terminal (Command line)
    [ ] Access to sources (connectors)


[ ] Sentry integration to track errors


[ ] On store setup new chat, the artifact should also be cleared (artifact should be in the chat store)
[ ] Use `/` in input  to open tools as context menu


[ ] Performance Optimizations
    [ ] Message depends on the whole chatHelpers, therefore it renders everytime a chunk is recevived
    [ ] On getQuery cache subscription, update the tree. Keep the message tree in a reference
    [ ] The updating cache for messages cause re-renders on the chat page. This is not needed.
    [ ] Build a store for Chat Input Provider so that it doesn't cause renders when unrelated parts of context changes
    [ ] Markdown Memoization per block  (https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization)



[ ] Transparency animation on text chunk streaming
[ ] Mermaid diagram rendering

[ ] Do we want optional props on the metadata?
[ ] Cleanup tool definitions type architecture (ToolName, UiToolName, ToolNameInternal, getTools, ChatTools)

[ ] User Message ++
    [ ] The user message should just be MultiModalInput with "view" mode (or non editing)
    [ ] Pasted links in the prompt should have rich formatting (in both multimodal input and user message)
    [ ] Clicking on an attached image (in multimodal input or in message view) should expand the image in a modal 
    [x] Retry mechanism should include all info about user submission

    
[ ] Create a settings page
    [ ] Define a credits price model
    [ ] Show usage (like cursor)

[ ] Replace Metadata "isPartial" with a more robust `data-` stream state (or checking if the message has part `finish`)

[ ] Add pinned messages to prefetch

[ ] Cleanup Redis client / server

[ ] Chat Request input
    [ ] Create a schema for chat request body
    [x] Data selectedTools should only have 1

[ ] Models++
    [ ] Cleanup up the providers.ts file
    [ ] Refactor Model, providers, modelCosts so that it's easier to add new models
    [ ] Propagate model selection to deep research (and create new selectables for them)

[ ] Models
    [ ] Create Non-thinking variants of models (e.g. Claude-4-Sonnet)
    [ ] More Gemini models
    [ ] Grok 4 -- add to models

[ ] Assistant Message ++
    [ ] Retry message should offer you options for selecting a new model. Update the `RetryButton` and set a new model in the metadata of the parent message.
    [ ] Tools selected for the generation of a message should be saved as part of the metadata so that they are used again in the retry


[ ] Save partial message on abort (stop) with AI SDK 5

[ ] MultiModalInput
    [x] Migrate to Lexical (there is a background agent with part of the work)
    [ ] Use rich format for links
    [x] Selected model should be part of the Chat-input-context
    [ ] Chat bottom row should not update on type
    [ ] The MultiModal input shouldn't know about chatHelpers, it should get functions related to them from a provider
    [ ] Save edit message text to localstorage

[ ] Threads
    [ ] A chat request with parentMessageId, should return a stream that indicates whats the parentMesssageId for that request
    [ ] A resumed stream will try to append to any message in the chatId, regardless of the thread it's in. Maybe use the `stop` helper?
    [ ] Artifacts should belong to the current thread
    [ ] Combination of thread switching and resumable streams doesn't work reliably. The stream should have the last message Id and not just the chat

[ ] Settings Page
    [ ] Define the models that you enable (like cursor)
    [ ] Show a Keyboard shortcuts help in settings


[ ] Bug: Analyze PDF with GPT-4o-mini is not working. Is it allowed by the model?


[ ] Define how to copy images for a shared chat
[ ] Duplicate chat (like the one for shared chats, but for your own chats)

[ ] Thinking tokens should be passed as context. Find a common format instead of filtering.

[ ] Code Execution ++

[ ] Tooltips are shifted when the sidebar is open

[ ] Images
    [ ] Image loading skeleton should have a nicer animation (like chatgpt). 
    [ ] Don't expose the prompt in the image result
    [ ] Image should have a download button
    [ ] It should be possible to display more than 1 image in the response (grid of 2 at certain sizes)
    [ ] Image should be expandable in a modal


[x] View Changes Button should be a toggle (should have a visible active state when active)

[ ] Chat history: 
    [ ] Virtual list for previous chats
    [x] Chats should be sorted by updatedAt (not by createdAt)


[x] Generated artifact create a new version when they render on Lexical


[ ] Security
    [ ] BotId Protection https://vercel.com/docs/botid

[ ] Durable streams
    [x] Create a message-continues data part and call resume from the frontend
    [ ] Restore from the branch named `background-tasks`
    [ ] Fix tree Provider with resumed messages

[ ] MCP-UI

[ ] MCP Support

[ ] Multi MCP (Connectors)
    [ ] Try picaos, ACI, **Smithery**


[x] Image as context for image generation (Blocked by AI SDK not having editImages function (to call openai edit images endpoint))
    [x] There is a branch called `image-edits` with WIP code for this.
    [x] gpt-image-1 is able to interpret input images as context
    [x] Move images from artifact to main thread

[ ] Pass messages to the create-document tools (Stashed as "pass contextForLLM to document handlers")

[x] Artifacts should use the selected model to generate the document

[ ] Get rid of deleteTrailingMessagesAsync or allow message deletion

[ ] "Is last artifact" detection in messages is more complex than needed.



[ ] Copy code button is too close to language / filename top header in code block

[x] Message Assistant with model info
    [x] Model selected needs to be part of the message **info**
    [x] Model needs to be part of the request data
    [x] Current model that generated the message should be detailed in the message actions (like t3)


[ ] Don't scroll to bottom when switching branches

[x] Optimize the Model Selector component
    [x] with lazy loading 
    [x] With memoization

[ ] Nicer model icons (and include in selectable trigger), like in https://ai-sdk.dev/playground/s/YUzrs1 RVBM7x

[x] Keyboard Shortcuts
    [x] New Chat button + show keyboard shortcut for it
    [ ] Show keyboard shortcuts in the settings page


[ ] Search through chat text (like chatgpt) for chat history search





[x] When unauthed, the cookie should switch to default model if not in the free models
[x] Chat action buttons make smaller, remove borders
[x] Use image avatar from next-auth session

[ ] Change Sparka Google Oauth to Sparka AI

[ ] Code
    [ ] Extend code editing and syntax highlighting to typescript
    [ ] Add run support for JavaScript / TypeSCript

[x] Image generation
    [x] Improve the tool description to make it more clear that it's an image generation tool



[x] Create a menu in the assistant message actions to retry (creating a new branch)


[ ] BYOK (Bring Your Own Key)



[ ] Chat sharing
    [x] Artifacts sharing
    [ ] Add "Make this chat discoverable" option to share modal
    [ ] Add social media sharing buttons (LinkedIn, Reddit, X) to share modal

[ ] Quote text from 'assistant messages' functionality (like chatgpt)

[ ] The useDeleteChat hook should use trpc, and have an optimistic mutation
[ ] Should generate title be on user message or on assistant message? At the moment it's on user for anonymous and on assistant for authenticated


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

[x] Why does visibility selector takes chat visibility as a prop?
[x] React Query Prefetch for the selected route
[ ] React Query Prefetch for the selected route with SSR

[ ] Migrate artifacts to ID + version or just ID as the main key

### Backend
[x] Create a button to Deep Research
[x] Write a chron job that deletes chatStream rows older than 24hs
[ ] Clearly define what's an update and what's a tool action in the backend, so that it can be used with more flexibility without changing frontend
[ ] Add manus-like plan as a document
[ ] Security: Verify that anonymous users can't see other users chats.
    [ ] Organize authorization as a layer at the beginning of each trpc procedure
[x] Migrate routes to TRPC (and use it in the frontend)


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

[ ] Open canvas button on navbar like chatgpt


### System
[x] Get rid of API keys, just use the backend keys
[x] TBD Create limits per accounts with a few credits

[ ] Syntax Highlighting
[x] Image Generation Support
[ ] Chat Branching
    [ ] Chat should be forkable (even shared ones)

[ ] Add more providers (Deepseek, etc)

[ ] Implement credit budget handling to disable tools that can't be on each step by using prepareStep from AI SDK 5
[ ] Fix broken CI workflows
[ ] Long running jobs
    [x] Restore deep research for reasoning models once we can go longer than 1m in request time.
[ ] Offer model variants without reasoning (for the ones that can be run with or without reasoning)
[ ] Optimize all-models by only using allImplementedModels. Needs to propagate discriminated unions typing correctly
[ ] Model definitions need more flexibility (or model variants). E.g. google provider have different tiers size, reasoning, etc

[ ] Migrate to Biome 2.0