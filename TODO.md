## MVP

[x] Show reasoning tokens in the UI
[x] Only launch with Deep Research (Disable reason search)
[x] Verify that backend doesn't timeout for this flow
[ ] MultiModal Input refinement
- [x] Improve multimodal input styles for long text, borders, roundness,
- [x] Attachments should be removable
- [x] Message attachments should be inside message box when visualizing and editing
- [x] Attachments should work with drop zone
[x] Fix reserved credit release on crash
[ ] Please wait until the message repsonse ends
[ ] Define project Name
[ ] Define project styles
[ ] Create / Edit document should have more context of the conversation than a description
[ ] Delete previous chat messages should also delete documents created / updated in that range of the conversation
[ ] Sign up with GitHub

### Backend
[ ] Clearly define what's an update and what's a tool action in the backend, so that it can be used with more flexibility without changing frontend
[ ] Deep research should have a step in which it decides if the question can be answered or it should continue researching.
[ ] Unify Deep research and reasonSearch
[ ] Add manus-like plan as a document

[x] Create a button to Deep Research
[ ] Refactor Model, providers, modelCosts so that it's easier to add new models
[ ] Propagate model selection to deep research / reason tools (and create new selectables for them)


### Frontend
[x] Annotations for search should be less granular, just a list of sites (like perplexity)
[x] Migrate to TRPC with Tanstack Query
[ ] Get model from cache in model selector while loading
[x] Edit message should have multimodal input box (instead of only Send and Cancel)
[ ] Chat history: 
- [ ] Search Chats
- [ ] Virtual list for previous chats
- [ ] Only render last document as preview, others as pill

### System
[x] Get rid of API keys, just use the backend keys
[x] TBD Create limits per accounts with a few credits
[ ] AI SDK 5 ?
[ ] Implement credit budget handling to disalbe tools that can't be on each step by using prepareStep from AI SDK 5



## Auth
[x] Add "Deployment" redirect URI 


PROMPT:

I'm trying to find domain names for a chat with your AI LLM Models application assistant.

Brainstorm 200 names variations I can try with prefixes for a chat application that works with many LLM models and is a helpful assistant.

Prefixes: ly, lio, ify, zen, os, us, in, up, it, er

Only print the roots (without the suffixes) I'll combine them later.

E.g. chat, assistant, assist, help, helper, pair, talk, knowledge, know, knowl, knowle, wise, wis, wisdom, wisdo, etc

Print as a comma separated list in text (no document)