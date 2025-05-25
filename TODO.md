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
[ ] Attachments should be removable
[ ] Improve multimodal input styles for long text, borders, roundness,


### System
[x] Get rid of API keys, just use the backend keys
[x] TBD Create limits per accounts with a few credits
[ ] AI SDK 5 ?
[ ] Implement credit budget handling to disalbe tools that can't be on each step by using prepareStep from AI SDK 5



## Auth
[x] Add "Deployment" redirect URI 