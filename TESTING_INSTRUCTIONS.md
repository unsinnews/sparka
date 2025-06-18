# Testing Instructions for Sparka Features

This document provides comprehensive testing instructions for all major features in the Sparka chat application.

## Prerequisites

1. Start the development server: `bun dev`
2. Navigate to `http://localhost:3000`
3. Ensure you have test files ready:
   - Sample images (PNG, JPG, WebP)
   - Sample PDFs
   - Various code snippets in different languages

## 1. Attachment Support

### Testing Image Uploads
1. **Basic Image Upload**:
   - Click the paperclip/attachment icon in the chat input
   - Select an image file (PNG, JPG, WebP)
   - Verify the image appears as a preview in the input area
   - Send the message and verify the image displays correctly in the chat

2. **PDF Upload**:
   - Click the attachment icon
   - Select a PDF file
   - Verify PDF preview appears
   - Send the message and verify PDF can be opened/viewed

3. **Multiple Attachments**:
   - Upload multiple files in a single message
   - Verify all attachments are displayed
   - Test removing individual attachments before sending

4. **File Size Limits**:
   - Try uploading very large files
   - Verify appropriate error messages for oversized files

5. **Unsupported Formats**:
   - Try uploading unsupported file types
   - Verify proper error handling and user feedback

### Expected Results
- Files upload successfully within size limits
- Images display with proper previews
- PDFs are accessible and viewable
- Error messages appear for invalid files

## 2. Image Generation Support

### Testing AI Image Generation
1. **Basic Image Generation**:
   - Send a message requesting an image: "Generate an image of a sunset over mountains"
   - Verify the AI generates and displays an image
   - Check image quality and relevance to the prompt

2. **Complex Prompts**:
   - Test detailed prompts with specific styles, colors, and compositions
   - Verify the generated images match the complexity of the request

3. **Multiple Images**:
   - Request multiple images in a single prompt
   - Verify all requested images are generated

4. **Image Editing Requests**:
   - Generate an image, then ask for modifications
   - Test if the AI can iterate on previously generated images

### Expected Results
- Images generate successfully
- Generated images are relevant to prompts
- Images display correctly in the chat interface

## 3. Syntax Highlighting

### Testing Code Formatting
1. **Inline Code**:
   - Send messages with `inline code snippets`
   - Verify proper formatting and highlighting

2. **Code Blocks**:
   - Test code blocks in various languages:
     ```javascript
     function test() {
       console.log("Hello World");
     }
     ```
   - Test languages: JavaScript, Python, TypeScript, HTML, CSS, SQL, etc.

3. **Language Detection**:
   - Send code without specifying language
   - Verify automatic language detection works

4. **Large Code Blocks**:
   - Test very long code snippets
   - Verify proper scrolling and formatting

### Expected Results
- Code appears with proper syntax highlighting
- Different languages have distinct color schemes
- Code blocks are properly formatted and readable

## 4. Resumable Streams

### Testing Stream Continuation
1. **Basic Stream Interruption**:
   - Start a conversation that generates a long response
   - Refresh the page mid-generation
   - Verify the response continues from where it left off

2. **Network Interruption**:
   - Simulate network disconnection during streaming
   - Reconnect and verify stream resumes

3. **Multiple Stream Sessions**:
   - Start multiple conversations
   - Refresh browser and verify all streams can resume

### Expected Results
- Streaming responses continue after page refresh
- No data loss during interruptions
- Seamless user experience across sessions

## 5. Chat Branching

### Testing Alternative Conversation Paths
1. **Create Branch**:
   - In an existing conversation, find the branch option (usually near message actions)
   - Click to create a new branch from a specific message
   - Verify a new conversation path is created

2. **Switch Between Branches**:
   - Navigate between different branches of the same conversation
   - Verify conversation history is maintained for each branch

3. **Branch Management**:
   - Test renaming branches
   - Test deleting branches
   - Verify branch persistence across sessions

### Expected Results
- Branches create successfully from any message
- Each branch maintains independent conversation state
- Easy navigation between branches

## 6. Chat Sharing

### Testing Conversation Sharing
1. **Generate Share Link**:
   - Click the share button in a conversation
   - Copy the generated share link
   - Verify link is created successfully

2. **Access Shared Chat**:
   - Open the share link in a new browser/incognito window
   - Verify the conversation is viewable
   - Test that shared chats are read-only (if applicable)

3. **Share Permissions**:
   - Test different sharing permission levels
   - Verify private conversations require authentication

4. **Share Link Management**:
   - Test disabling/revoking share links
   - Verify revoked links no longer work

### Expected Results
- Share links generate successfully
- Shared conversations are accessible via links
- Appropriate permissions are enforced

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

3. **Search Results Integration**:
   - Verify search results are incorporated into AI responses
   - Check that sources are cited properly
   - Test result relevance and accuracy

4. **Search Performance**:
   - Test response time with web search enabled
   - Verify search doesn't significantly slow down responses

### Expected Results
- Web search provides current, relevant information
- Sources are properly cited
- Search results enhance AI responses

## 8. Edit Message Plus

### Testing Message Editing
1. **Basic Message Edit**:
   - Click on any sent message
   - Verify edit interface appears
   - Modify the message text and save
   - Verify the conversation updates accordingly

2. **Edit Attachments**:
   - Edit a message with attachments
   - Add new attachments
   - Remove existing attachments
   - Verify changes are applied correctly

3. **Edit Toggles/Settings**:
   - Edit a message and change model settings
   - Modify search toggles (web search, deep research)
   - Verify settings changes affect the response

4. **Edit Model Selection**:
   - Edit a message and change the AI model
   - Verify the response regenerates with the new model
   - Test switching between different model types

5. **Edit History**:
   - Make multiple edits to the same message
   - Verify edit history is maintained (if applicable)

### Expected Results
- Messages can be edited seamlessly
- Attachments, toggles, and models can be modified during editing
- Conversation flow updates appropriately after edits

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

3. **Research Process**:
   - Verify the research process is visible to the user
   - Check for research progress indicators
   - Test that multiple sources are consulted

4. **Research Results**:
   - Verify comprehensive, well-researched responses
   - Check that sources are properly cited
   - Test the depth and accuracy of research findings

### Expected Results
- Deep research provides comprehensive, well-sourced responses
- Research process is transparent to users
- Results demonstrate thorough investigation of the topic

## General Testing Notes

### Cross-Feature Testing
- Test combinations of features (e.g., attachments + web search)
- Verify features work together seamlessly
- Test feature interactions in different browsers

### Performance Testing
- Monitor response times with different features enabled
- Test with large files and complex queries
- Verify the application remains responsive

### Error Handling
- Test each feature's behavior with invalid inputs
- Verify appropriate error messages are displayed
- Test recovery from error states

### Accessibility
- Test features with keyboard navigation
- Verify screen reader compatibility
- Test with different browser accessibility settings

## Reporting Issues

When reporting issues, please include:
1. Feature being tested
2. Steps to reproduce
3. Expected vs. actual behavior
4. Browser and version
5. Screenshots or screen recordings (if applicable)
6. Console errors (if any)

## Test Environment Verification

Before testing, verify:
- [ ] Development server is running
- [ ] Database is connected and accessible
- [ ] All environment variables are properly configured
- [ ] Test files and resources are available 