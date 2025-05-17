# Product Context

## Core Problem
Users often have lengthy video content and lack the time or tools to efficiently find the most important, engaging, or relevant segments. Manually scrubbing through videos is time-consuming and inefficient.

## Target Users
*To be defined. Examples could include content creators, marketers, students, researchers, or anyone who works with video content and needs to quickly extract key information or share highlights.*
Their primary need is to save time and effort in video consumption and analysis by quickly accessing the most valuable parts of a video.

## Proposed Solution
An AI-powered web platform that allows users to upload videos. The platform will then automatically analyze the video content to identify and extract "highlights" or the "best moments." These highlights will be presented to the user, making it easy to view, understand, and potentially share the key parts of the video.

## Key Features & Functionality
Based on `projectbrief.md`:
- Video upload mechanism.
- AI-powered extraction of highlights (e.g., timestamps, dummy captions at MVP).
- Display of extracted highlights to the user.
- User authentication (Supabase OAuth) - optional at MVP.
- A user interface (Next.js, TailwindCSS, shadcn/ui) for uploading videos and viewing highlights.

## User Experience Goals
*To be further defined. Initial thoughts based on the stack and hackathon context:*
- **Simple and Intuitive:** Easy to upload a video and see results.
- **Fast:** Quick processing (even if mocked initially) and responsive UI.
- **Clear:** Highlights should be presented in an understandable way.
- **Modern & Clean:** Leveraging shadcn/ui and TailwindCSS for a polished look.

## Non-Goals
*To be further defined. Based on MVP focus in `projectbrief.md`:*
- Complex video editing features beyond viewing highlights.
- Advanced AI analysis beyond "best moments" (e.g., detailed object recognition, sentiment analysis) for the initial MVP.
- User accounts and persisted user-specific data if Supabase auth is deferred beyond MVP.

*(This file should be updated based on the `projectbrief.md` and ongoing discussions.)*
