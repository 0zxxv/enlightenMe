import {
  BookingStatus,
  CourseFormat,
  CourseStatus,
  CourseType,
  Language,
  Role,
  SessionStatus,
  VerificationStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dars database...');

  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.courseSession.deleteMany();
  await prisma.courseCurriculumItem.deleteMany();
  await prisma.course.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.instituteMember.deleteMany();
  await prisma.institute.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.college.deleteMany();
  await prisma.university.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const school = await prisma.courseCategory.create({
    data: { slug: 'school', nameEn: 'School', nameAr: 'مدارس' },
  });
  const universityCat = await prisma.courseCategory.create({
    data: { slug: 'university', nameEn: 'University', nameAr: 'جامعة' },
  });
  const skills = await prisma.courseCategory.create({
    data: { slug: 'skills', nameEn: 'Skills', nameAr: 'مهارات' },
  });
  const design3d = await prisma.courseCategory.create({
    data: {
      slug: '3d-design',
      nameEn: '3D & Design',
      nameAr: 'تصميم ثلاثي الأبعاد',
      parentId: skills.id,
    },
  });

  const uob = await prisma.university.create({
    data: {
      nameEn: 'University of Bahrain',
      nameAr: 'جامعة البحرين',
    },
  });
  const collegeIt = await prisma.college.create({
    data: {
      nameEn: 'College of Information Technology',
      nameAr: 'كلية تقنية المعلومات',
      universityId: uob.id,
    },
  });

  const [math, physics, english, chemistry, algorithms, blender] = await Promise.all([
    prisma.subject.create({
      data: { nameEn: 'Mathematics', nameAr: 'الرياضيات', categoryId: school.id },
    }),
    prisma.subject.create({
      data: { nameEn: 'Physics', nameAr: 'الفيزياء', categoryId: school.id },
    }),
    prisma.subject.create({
      data: { nameEn: 'English', nameAr: 'اللغة الإنجليزية', categoryId: school.id },
    }),
    prisma.subject.create({
      data: { nameEn: 'Chemistry', nameAr: 'الكيمياء', categoryId: school.id },
    }),
    prisma.subject.create({
      data: { nameEn: 'Algorithms', nameAr: 'الخوارزميات', categoryId: universityCat.id },
    }),
    prisma.subject.create({
      data: { nameEn: 'Blender', nameAr: 'بلندر', categoryId: design3d.id },
    }),
  ]);

  const sara = await prisma.user.create({
    data: {
      email: 'sara.almansoori@dars.app',
      passwordHash,
      firstName: 'Sara',
      lastName: 'AlMansoori',
      phone: '+97336000001',
      role: Role.Tutor,
      language: Language.en,
      tutorProfile: {
        create: {
          bio: 'Computer science tutor specializing in algorithms and school mathematics.',
          expertise: ['Algorithms', 'Mathematics', 'Data Structures'],
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.8,
          ratingCount: 12,
          studentCount: 45,
          courseCount: 2,
        },
      },
    },
    include: { tutorProfile: true },
  });

  const zahra = await prisma.user.create({
    data: {
      email: 'zahra.ali@dars.app',
      passwordHash,
      firstName: 'Zahra',
      lastName: 'Ali',
      phone: '+97336000002',
      role: Role.Tutor,
      language: Language.en,
      tutorProfile: {
        create: {
          bio: '3D artist and Blender instructor for beginners and creatives.',
          expertise: ['Blender', '3D Modeling', 'Rendering'],
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.9,
          ratingCount: 8,
          studentCount: 30,
          courseCount: 1,
        },
      },
    },
    include: { tutorProfile: true },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@dars.app',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Student',
      phone: '+97336000003',
      role: Role.Student,
      language: Language.en,
      studentProfile: {
        create: { grade: '12', school: 'Demo High School' },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@dars.app',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.Admin,
      language: Language.en,
    },
  });

  const itcs347 = await prisma.course.create({
    data: {
      title: 'Analysis and Design of Algorithms',
      titleAr: 'تحليل وتصميم الخوارزميات',
      description:
        'University course covering algorithm analysis, design paradigms, and complexity.',
      descriptionAr: 'مقرر جامعي يغطي تحليل الخوارزميات ونماذج التصميم والتعقيد.',
      categoryId: universityCat.id,
      subjectId: algorithms.id,
      type: CourseType.University,
      level: 'Undergraduate',
      universityId: uob.id,
      collegeId: collegeIt.id,
      courseCode: 'ITCS347',
      major: 'Computer Science',
      priceDecimal: 120,
      currency: 'BHD',
      durationMinutes: 90,
      sessionCount: 12,
      capacity: 25,
      format: CourseFormat.Hybrid,
      location: 'University of Bahrain — College of IT',
      status: CourseStatus.Published,
      tutorId: sara.id,
      ratingAvg: 4.7,
      ratingCount: 5,
      curriculum: {
        create: [
          { order: 1, title: 'Asymptotic Analysis', titleAr: 'التحليل المقارب' },
          { order: 2, title: 'Divide and Conquer', titleAr: 'فرّق تسد' },
          { order: 3, title: 'Dynamic Programming', titleAr: 'البرمجة الديناميكية' },
          { order: 4, title: 'Graph Algorithms', titleAr: 'خوارزميات الرسوم البيانية' },
        ],
      },
    },
  });

  const mathG12 = await prisma.course.create({
    data: {
      title: 'Mathematics — Grade 12',
      titleAr: 'الرياضيات — الصف الثاني عشر',
      description: 'School mathematics tutoring covering Grade 12 curriculum topics.',
      descriptionAr: 'دروس خصوصية في رياضيات الصف الثاني عشر.',
      categoryId: school.id,
      subjectId: math.id,
      type: CourseType.School,
      grade: '12',
      level: 'Advanced',
      priceDecimal: 45,
      currency: 'BHD',
      durationMinutes: 60,
      sessionCount: 8,
      capacity: 8,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: sara.id,
      ratingAvg: 4.9,
      ratingCount: 7,
      curriculum: {
        create: [
          { order: 1, title: 'Functions & Graphs' },
          { order: 2, title: 'Calculus Foundations' },
          { order: 3, title: 'Probability' },
          { order: 4, title: 'Exam Practice' },
        ],
      },
    },
  });

  const blenderCourse = await prisma.course.create({
    data: {
      title: 'Blender 3D for Beginners',
      titleAr: 'بلندر ثلاثي الأبعاد للمبتدئين',
      description:
        'Learn Blender from scratch: interface, modeling, materials, lighting, and rendering.',
      descriptionAr: 'تعلّم بلندر من الصفر: الواجهة، النمذجة، المواد، الإضاءة، والإخراج.',
      categoryId: design3d.id,
      subjectId: blender.id,
      type: CourseType.Skills,
      level: 'Beginner',
      priceDecimal: 85,
      currency: 'BHD',
      durationMinutes: 120,
      sessionCount: 8,
      capacity: 10,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: zahra.id,
      ratingAvg: 5,
      ratingCount: 3,
      curriculum: {
        create: [
          { order: 1, title: 'Intro', titleAr: 'مقدمة', description: 'Course overview and setup' },
          {
            order: 2,
            title: 'Interface',
            titleAr: 'الواجهة',
            description: 'Viewport, panels, and navigation',
          },
          {
            order: 3,
            title: 'Modeling',
            titleAr: 'النمذجة',
            description: 'Mesh editing fundamentals',
          },
          {
            order: 4,
            title: 'Modifiers',
            titleAr: 'المعدّلات',
            description: 'Subdivision, mirror, and array',
          },
          {
            order: 5,
            title: 'Materials',
            titleAr: 'المواد',
            description: 'Shader editor basics',
          },
          {
            order: 6,
            title: 'Lighting',
            titleAr: 'الإضاءة',
            description: 'Three-point lighting setups',
          },
          {
            order: 7,
            title: 'Rendering',
            titleAr: 'الإخراج',
            description: 'Cycles and EEVEE renders',
          },
          {
            order: 8,
            title: 'Final Project',
            titleAr: 'المشروع النهائي',
            description: 'Complete a small scene end-to-end',
          },
        ],
      },
    },
  });

  const inTwoWeeks = new Date();
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
  const inThreeWeeks = new Date();
  inThreeWeeks.setDate(inThreeWeeks.getDate() + 21);
  const inOneMonth = new Date();
  inOneMonth.setDate(inOneMonth.getDate() + 30);

  const makeSession = (courseId: string, startsAt: Date, seatsTotal: number) => {
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + 90);
    return prisma.courseSession.create({
      data: {
        courseId,
        startsAt,
        endsAt,
        seatsAvailable: seatsTotal,
        seatsTotal,
        status: SessionStatus.Scheduled,
      },
    });
  };

  const [itcsSession, mathSession, blenderSession] = await Promise.all([
    makeSession(itcs347.id, inTwoWeeks, 25),
    makeSession(mathG12.id, inThreeWeeks, 8),
    makeSession(blenderCourse.id, inOneMonth, 10),
  ]);

  const completedBooking = await prisma.booking.create({
    data: {
      userId: student.id,
      courseId: blenderCourse.id,
      sessionId: blenderSession.id,
      status: BookingStatus.Completed,
      priceSnapshot: blenderCourse.priceDecimal,
      currency: 'BHD',
    },
  });

  // Restore seat after completed seed booking used for review
  await prisma.courseSession.update({
    where: { id: blenderSession.id },
    data: { seatsAvailable: 9 },
  });

  await prisma.review.create({
    data: {
      bookingId: completedBooking.id,
      userId: student.id,
      courseId: blenderCourse.id,
      tutorId: zahra.tutorProfile!.id,
      rating: 5,
      comment: 'Clear lessons and great pacing for absolute beginners.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: (
        await prisma.booking.create({
          data: {
            userId: student.id,
            courseId: mathG12.id,
            sessionId: mathSession.id,
            status: BookingStatus.Completed,
            priceSnapshot: mathG12.priceDecimal,
            currency: 'BHD',
          },
        })
      ).id,
      userId: student.id,
      courseId: mathG12.id,
      tutorId: sara.tutorProfile!.id,
      rating: 5,
      comment: 'Sara explains Grade 12 math with patience and clarity.',
    },
  });

  await prisma.courseSession.update({
    where: { id: mathSession.id },
    data: { seatsAvailable: 7 },
  });

  console.log('Seed complete:', {
    categories: [school.slug, universityCat.slug, skills.slug, design3d.slug],
    tutors: [sara.email, zahra.email],
    student: student.email,
    courses: [itcs347.courseCode, mathG12.title, blenderCourse.title],
    sessions: [itcsSession.id, mathSession.id, blenderSession.id],
    subjects: [math.nameEn, physics.nameEn, english.nameEn, chemistry.nameEn, algorithms.nameEn, blender.nameEn],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
