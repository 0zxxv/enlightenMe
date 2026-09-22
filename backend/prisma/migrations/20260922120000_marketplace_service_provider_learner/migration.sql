-- Marketplace architecture: ServiceType / ProviderType / LearnerType

CREATE TYPE "ServiceType" AS ENUM ('SchoolCourse', 'UniversityCourse', 'TrainingSkill');
CREATE TYPE "ProviderType" AS ENUM ('Teacher', 'Institute', 'Trainer');
CREATE TYPE "LearnerType" AS ENUM ('SchoolStudent', 'UniversityStudent', 'Individual');

-- Course: rename type → serviceType with value migration
ALTER TABLE "Course" ADD COLUMN "serviceType" "ServiceType";

UPDATE "Course"
SET "serviceType" = CASE
  WHEN "type"::text = 'School' THEN 'SchoolCourse'::"ServiceType"
  WHEN "type"::text = 'University' THEN 'UniversityCourse'::"ServiceType"
  WHEN "type"::text = 'Skills' THEN 'TrainingSkill'::"ServiceType"
  ELSE 'TrainingSkill'::"ServiceType"
END;

ALTER TABLE "Course" ALTER COLUMN "serviceType" SET NOT NULL;
DROP INDEX IF EXISTS "Course_type_idx";
ALTER TABLE "Course" DROP COLUMN "type";
DROP TYPE "CourseType";

ALTER TABLE "Course" ADD COLUMN "stage" TEXT;
ALTER TABLE "Course" ADD COLUMN "curriculumName" TEXT;
ALTER TABLE "Course" ADD COLUMN "skillCategory" TEXT;

CREATE INDEX "Course_serviceType_idx" ON "Course"("serviceType");

-- Tutor provider type (default Teacher for existing tutors)
ALTER TABLE "TutorProfile" ADD COLUMN "providerType" "ProviderType" NOT NULL DEFAULT 'Teacher';
CREATE INDEX "TutorProfile_providerType_idx" ON "TutorProfile"("providerType");

-- Learner type on student profiles
ALTER TABLE "StudentProfile" ADD COLUMN "learnerType" "LearnerType";
