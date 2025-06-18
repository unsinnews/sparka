# Testing Instructions for Sparka Features

This document provides comprehensive testing instructions for all major features in the Sparka chat application.

## Prerequisites

1. Start the development server: `bun dev`
2. Navigate to `http://localhost:3000`

## 1. Attachment Support

### Testing Image Uploads
1. **Basic Image Upload**:
   - Click the paperclip/attachment icon in the chat input
   - Select an image file (PNG, JPG, WebP)
   - Verify the image appears as a preview in the input area
   - Send the message and verify the image displays correctly in the chat
   - Ask what's in the image

2. **PDF Upload**:
   - Click the attachment icon
   - Select a PDF file
   - Verify PDF preview appears
   - Send the message and verify PDF can be opened/viewed
   - Ask what's in the PDF

3. **Multiple Attachments**:
   - Upload multiple files in a single message
   - Verify all attachments are displayed
   - Test removing individual attachments before sending

## 2. Image Generation Support

### Testing AI Image Generation
1. **Basic Image Generation**:
   - Prompt: "Create document with an image of a kitty playing in the beach"
   - Verify the AI generates and displays an image

## 3. Syntax Highlighting

### Testing Code Formatting
1. Promt: "Write code for a hello world in Python in a document"


## 4. Resumable Streams

### Testing Stream Continuation
1. **Basic Stream Interruption**:
   - Start a conversation that generates a long response
   - Refresh the page mid-generation
   - Verify the response continues from where it left off


## 5. Chat Branching

### Testing Alternative Conversation Paths
1. **Create Branch**:
   - In an existing conversation, edit any user message
   - Switch between branches with the branch selector

2. **Switch Between Branches**:
   - Navigate between different branches of the same conversation
   - Verify conversation history is maintained for each branch

   - When the conversion is loaded, the last message received is displayed
   - The message is attached to the right branch


## 6. Chat Sharing

### Testing Conversation Sharing
1. **Generate Share Link**:
   - Click the share button in a conversation or in the history in the sidebar
   - Copy the generated share link

2. **Access Shared Chat**:
   - Open the share link in a new browser/incognito window
   - Verify the conversation is viewable
   - The shared chats are read-only
   - Save the conversation as a logged in user or as anonymous user

3. **Share Link Management**:
   - Test disabling/revoking share links
   - Verify revoked links no longer work

## 7. Web Search

### Testing Real-time Web Search
1. **Enable Web Search**:
   - Look for web search toggle in the interface
   - Enable web search for a conversation

2. **Search Queries**:
   - Ask questions that would benefit from web search:
     - "What's the latest news about AI?"
     - "What's the weather in New York today?"
     - "What are the current stock prices for tech companies?"
    - Open the search info panel (above the assistant message)

## 8. Edit Message Plus

### Testing Message Editing
1. **Basic Message Edit**:
   - Click on any sent message
   - Verify edit interface appears
   - Modify the message text and save
   - Verify the conversation updates accordingly

**Editable Message Properties**:
   - Attachments (add/remove/modify)
   - Model Selection
   - Search toggles (web search, deep research)
   - Message content
   - Verify all changes regenerate the response correctly


## 9. Deep Research

### Testing Deep Research Functionality
1. **Enable Deep Research**:
   - Look for deep research toggle in the interface
   - Enable deep research for a conversation

2. **Research Queries**:
   - Ask complex questions requiring in-depth research:
     - "Analyze the impact of renewable energy on global economics"
     - "What are the latest developments in quantum computing?"
     - "Compare different machine learning approaches for natural language processing"

