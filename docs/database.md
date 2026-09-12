# Database

PostgreSQL via Prisma (`backend/prisma/schema.prisma`).

## Core entities

User, StudentProfile, ParentProfile, TutorProfile, Institute, InstituteMember, CourseCategory, Subject, University, College, Course, CourseCurriculumItem, CourseSession, Booking, Payment, Review, Favorite, Conversation, ConversationParticipant, Message, Payout, RefreshToken.

## Rules

- Money stored as `Decimal`
- Migrations only via Prisma — never hand-edit production schema
- Seed (`npm run db:seed`) includes ITCS347, Grade 12 Math, and Blender 3D for Beginners (Zahra Ali)

## Neon

Project identifier: `enlightenme`. Use pooler connection strings for the API. Separate branches for staging/production.
