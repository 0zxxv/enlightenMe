import {
  BookingStatus,
  CourseFormat,
  CourseStatus,
  ServiceType,
  Language,
  LearnerType,
  PaymentStatus,
  ProviderType,
  Role,
  SessionStatus,
  VerificationStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 16) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

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
    data: { nameEn: 'University of Bahrain', nameAr: 'جامعة البحرين' },
  });
  const collegeIt = await prisma.college.create({
    data: {
      nameEn: 'College of Information Technology',
      nameAr: 'كلية تقنية المعلومات',
      universityId: uob.id,
    },
  });
  const collegeScience = await prisma.college.create({
    data: {
      nameEn: 'College of Science',
      nameAr: 'كلية العلوم',
      universityId: uob.id,
    },
  });

  const [math, physics, english, chemistry, algorithms, blender, programming] =
    await Promise.all([
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
      prisma.subject.create({
        data: { nameEn: 'Programming', nameAr: 'البرمجة', categoryId: universityCat.id },
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
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.8,
          ratingCount: 12,
          studentCount: 45,
          courseCount: 3,
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
          providerType: ProviderType.Trainer,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.9,
          ratingCount: 8,
          studentCount: 30,
          courseCount: 2,
        },
      },
    },
    include: { tutorProfile: true },
  });

  const omar = await prisma.user.create({
    data: {
      email: 'omar.hassan@dars.app',
      passwordHash,
      firstName: 'Omar',
      lastName: 'Hassan',
      phone: '+97336000004',
      role: Role.Tutor,
      language: Language.en,
      tutorProfile: {
        create: {
          bio: 'Physics and chemistry tutor for Bahrain secondary school students.',
          expertise: ['Physics', 'Chemistry', 'Exam Prep'],
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.6,
          ratingCount: 15,
          studentCount: 52,
          courseCount: 2,
        },
      },
    },
    include: { tutorProfile: true },
  });

  const layla = await prisma.user.create({
    data: {
      email: 'layla.farid@dars.app',
      passwordHash,
      firstName: 'Layla',
      lastName: 'Farid',
      phone: '+97336000005',
      role: Role.Tutor,
      language: Language.en,
      tutorProfile: {
        create: {
          bio: 'English language coach for school and IELTS preparation.',
          expertise: ['English', 'IELTS', 'Writing'],
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.7,
          ratingCount: 20,
          studentCount: 60,
          courseCount: 2,
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
        create: {
          learnerType: LearnerType.SchoolStudent,
          grade: '12',
          school: 'Demo High School',
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'nour.khalifa@dars.app',
      passwordHash,
      firstName: 'Nour',
      lastName: 'Khalifa',
      phone: '+97336000006',
      role: Role.Student,
      language: Language.en,
      studentProfile: {
        create: {
          learnerType: LearnerType.SchoolStudent,
          grade: '11',
          school: 'Al Noor Secondary',
        },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'yusuf.rahman@dars.app',
      passwordHash,
      firstName: 'Yusuf',
      lastName: 'Rahman',
      phone: '+97336000007',
      role: Role.Student,
      language: Language.en,
      studentProfile: {
        create: {
          learnerType: LearnerType.UniversityStudent,
          grade: 'Year 3',
          school: 'University of Bahrain',
        },
      },
    },
  });

  const instituteAdmin = await prisma.user.create({
    data: {
      email: 'institute@dars.app',
      passwordHash,
      firstName: 'Rania',
      lastName: 'AlKooheji',
      phone: '+97336000008',
      role: Role.InstituteAdmin,
      language: Language.en,
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

  const brightMinds = await prisma.institute.create({
    data: {
      name: 'Bright Minds Academy',
      nameAr: 'أكاديمية العقول المشرقة',
      description: 'Secondary school tutoring centre in Manama covering STEM subjects.',
      verificationStatus: VerificationStatus.Verified,
      ratingAvg: 4.6,
      ratingCount: 18,
      members: { create: [{ userId: instituteAdmin.id, role: 'admin' }] },
    },
  });

  const codeLab = await prisma.institute.create({
    data: {
      name: 'CodeLab Bahrain',
      nameAr: 'كود لاب البحرين',
      description: 'Coding bootcamps and university CS support for Bahrain learners.',
      verificationStatus: VerificationStatus.Verified,
      ratingAvg: 4.8,
      ratingCount: 11,
    },
  });

  const artNest = await prisma.institute.create({
    data: {
      name: 'ArtNest Studio',
      nameAr: 'استوديو آرت نست',
      description: 'Creative skills hub for 3D, design, and digital art.',
      verificationStatus: VerificationStatus.Pending,
      ratingAvg: 4.4,
      ratingCount: 6,
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
      serviceType: ServiceType.UniversityCourse,
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
      instituteId: codeLab.id,
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
      serviceType: ServiceType.SchoolCourse,
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
      instituteId: brightMinds.id,
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
      serviceType: ServiceType.TrainingSkill,
      level: 'Beginner',
      priceDecimal: 85,
      currency: 'BHD',
      durationMinutes: 120,
      sessionCount: 8,
      capacity: 10,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: zahra.id,
      instituteId: artNest.id,
      ratingAvg: 5,
      ratingCount: 3,
      curriculum: {
        create: [
          { order: 1, title: 'Introduction to Blender', titleAr: 'مقدمة' },
          { order: 2, title: 'Modeling Basics', titleAr: 'أساسيات النمذجة' },
          { order: 3, title: 'Modifiers and Tools', titleAr: 'المعدّلات والأدوات' },
          { order: 4, title: 'Materials and Textures', titleAr: 'المواد والملمس' },
          { order: 5, title: 'Lighting and Rendering', titleAr: 'الإضاءة والإخراج' },
        ],
      },
    },
  });

  const physicsG11 = await prisma.course.create({
    data: {
      title: 'Physics — Grade 11',
      titleAr: 'الفيزياء — الصف الحادي عشر',
      description: 'Mechanics, waves, and electricity aligned to the Bahrain Grade 11 syllabus.',
      descriptionAr: 'ميكانيكا وموجات وكهرباء وفق منهج الصف الحادي عشر في البحرين.',
      categoryId: school.id,
      subjectId: physics.id,
      serviceType: ServiceType.SchoolCourse,
      grade: '11',
      level: 'Intermediate',
      priceDecimal: 40,
      currency: 'BHD',
      durationMinutes: 60,
      sessionCount: 10,
      capacity: 12,
      format: CourseFormat.Hybrid,
      location: 'Bright Minds Academy — Manama',
      status: CourseStatus.Published,
      tutorId: omar.id,
      instituteId: brightMinds.id,
      ratingAvg: 4.5,
      ratingCount: 9,
      curriculum: {
        create: [
          { order: 1, title: 'Kinematics' },
          { order: 2, title: 'Newton’s Laws' },
          { order: 3, title: 'Work & Energy' },
          { order: 4, title: 'Waves' },
          { order: 5, title: 'Electric Circuits' },
        ],
      },
    },
  });

  const chemG12 = await prisma.course.create({
    data: {
      title: 'Chemistry — Grade 12',
      titleAr: 'الكيمياء — الصف الثاني عشر',
      description: 'Organic chemistry and exam drills for Grade 12 students.',
      descriptionAr: 'كيمياء عضوية وتمارين امتحانات للصف الثاني عشر.',
      categoryId: school.id,
      subjectId: chemistry.id,
      serviceType: ServiceType.SchoolCourse,
      grade: '12',
      level: 'Advanced',
      priceDecimal: 42,
      currency: 'BHD',
      durationMinutes: 60,
      sessionCount: 8,
      capacity: 10,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: omar.id,
      instituteId: brightMinds.id,
      ratingAvg: 4.4,
      ratingCount: 6,
      curriculum: {
        create: [
          { order: 1, title: 'Organic Basics' },
          { order: 2, title: 'Reaction Mechanisms' },
          { order: 3, title: 'Lab Skills' },
          { order: 4, title: 'Past Papers' },
        ],
      },
    },
  });

  const englishIelts = await prisma.course.create({
    data: {
      title: 'IELTS Speaking & Writing',
      titleAr: 'آيلتس — المحادثة والكتابة',
      description: 'Targeted IELTS practice for Speaking and Writing bands 6.5+.',
      descriptionAr: 'تدريب مركّز على المحادثة والكتابة لآيلتس بمستوى 6.5 فأعلى.',
      categoryId: skills.id,
      subjectId: english.id,
      serviceType: ServiceType.TrainingSkill,
      level: 'Intermediate',
      priceDecimal: 55,
      currency: 'BHD',
      durationMinutes: 75,
      sessionCount: 6,
      capacity: 8,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: layla.id,
      ratingAvg: 4.8,
      ratingCount: 14,
      curriculum: {
        create: [
          { order: 1, title: 'Speaking Part 1–2' },
          { order: 2, title: 'Speaking Part 3' },
          { order: 3, title: 'Task 1 Writing' },
          { order: 4, title: 'Task 2 Essays' },
          { order: 5, title: 'Mock Exam' },
        ],
      },
    },
  });

  const pythonIntro = await prisma.course.create({
    data: {
      title: 'Python Programming for Beginners',
      titleAr: 'بايثون للمبتدئين',
      description: 'Learn Python fundamentals with hands-on exercises and mini projects.',
      descriptionAr: 'تعلّم أساسيات بايثون بتمارين عملية ومشاريع صغيرة.',
      categoryId: universityCat.id,
      subjectId: programming.id,
      serviceType: ServiceType.UniversityCourse,
      level: 'Beginner',
      universityId: uob.id,
      collegeId: collegeIt.id,
      courseCode: 'ITCS101',
      major: 'Computer Science',
      priceDecimal: 70,
      currency: 'BHD',
      durationMinutes: 90,
      sessionCount: 10,
      capacity: 20,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: sara.id,
      instituteId: codeLab.id,
      ratingAvg: 4.6,
      ratingCount: 10,
      curriculum: {
        create: [
          { order: 1, title: 'Variables & Types' },
          { order: 2, title: 'Control Flow' },
          { order: 3, title: 'Functions' },
          { order: 4, title: 'Lists & Dicts' },
          { order: 5, title: 'Mini Project' },
        ],
      },
    },
  });

  const englishG10 = await prisma.course.create({
    data: {
      title: 'English — Grade 10',
      titleAr: 'اللغة الإنجليزية — الصف العاشر',
      description: 'Reading comprehension, grammar, and writing for Grade 10.',
      descriptionAr: 'فهم المقروء والقواعد والكتابة للصف العاشر.',
      categoryId: school.id,
      subjectId: english.id,
      serviceType: ServiceType.SchoolCourse,
      grade: '10',
      level: 'Intermediate',
      priceDecimal: 35,
      currency: 'BHD',
      durationMinutes: 55,
      sessionCount: 8,
      capacity: 12,
      format: CourseFormat.InPerson,
      location: 'Bright Minds Academy — Isa Town',
      status: CourseStatus.Published,
      tutorId: layla.id,
      instituteId: brightMinds.id,
      ratingAvg: 4.3,
      ratingCount: 4,
      curriculum: {
        create: [
          { order: 1, title: 'Reading Skills' },
          { order: 2, title: 'Grammar Review' },
          { order: 3, title: 'Paragraph Writing' },
          { order: 4, title: 'Oral Practice' },
        ],
      },
    },
  });

  const advancedBlender = await prisma.course.create({
    data: {
      title: 'Advanced Blender Lighting',
      titleAr: 'إضاءة بلندر المتقدمة',
      description: 'Cinematic lighting, HDRI setups, and Cycles optimization.',
      descriptionAr: 'إضاءة سينمائية وإعدادات HDRI وتحسين Cycles.',
      categoryId: design3d.id,
      subjectId: blender.id,
      serviceType: ServiceType.TrainingSkill,
      level: 'Advanced',
      priceDecimal: 95,
      currency: 'BHD',
      durationMinutes: 120,
      sessionCount: 6,
      capacity: 8,
      format: CourseFormat.Online,
      status: CourseStatus.Published,
      tutorId: zahra.id,
      instituteId: artNest.id,
      ratingAvg: 4.9,
      ratingCount: 2,
      curriculum: {
        create: [
          { order: 1, title: 'Light Types' },
          { order: 2, title: 'HDRI Worlds' },
          { order: 3, title: 'Look Development' },
          { order: 4, title: 'Render Passes' },
        ],
      },
    },
  });

  const makeSession = async (
    courseId: string,
    startsAt: Date,
    seatsTotal: number,
    durationMinutes = 90,
  ) => {
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);
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

  const [
    itcsSessionA,
    itcsSessionB,
    mathSessionA,
    mathSessionB,
    blenderSessionA,
    blenderSessionB,
    physicsSession,
    chemSession,
    ieltsSession,
    pythonSession,
    englishSession,
    advBlenderSession,
  ] = await Promise.all([
    makeSession(itcs347.id, daysFromNow(7, 17), 25),
    makeSession(itcs347.id, daysFromNow(14, 17), 25),
    makeSession(mathG12.id, daysFromNow(5, 18), 8, 60),
    makeSession(mathG12.id, daysFromNow(12, 18), 8, 60),
    makeSession(blenderCourse.id, daysFromNow(10, 19), 10, 120),
    makeSession(blenderCourse.id, daysFromNow(24, 19), 10, 120),
    makeSession(physicsG11.id, daysFromNow(6, 16), 12, 60),
    makeSession(chemG12.id, daysFromNow(9, 17), 10, 60),
    makeSession(englishIelts.id, daysFromNow(8, 20), 8, 75),
    makeSession(pythonIntro.id, daysFromNow(11, 18), 20),
    makeSession(englishG10.id, daysFromNow(4, 15), 12, 55),
    makeSession(advancedBlender.id, daysFromNow(18, 19), 8, 120),
  ]);

  const createBooking = async (input: {
    userId: string;
    courseId: string;
    sessionId: string;
    status: BookingStatus;
    price: number;
    paymentStatus?: PaymentStatus;
    paid?: boolean;
  }) => {
    const booking = await prisma.booking.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        sessionId: input.sessionId,
        status: input.status,
        priceSnapshot: input.price,
        currency: 'BHD',
      },
    });

    if (input.paymentStatus) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: input.price,
          currency: 'BHD',
          status: input.paymentStatus,
          provider: 'stub',
          providerRef: `stub_${booking.id.slice(0, 8)}`,
          paidAt: input.paid ? new Date() : null,
        },
      });
    }

    await prisma.courseSession.update({
      where: { id: input.sessionId },
      data: { seatsAvailable: { decrement: 1 } },
    });

    return booking;
  };

  const blenderCompleted = await createBooking({
    userId: student.id,
    courseId: blenderCourse.id,
    sessionId: blenderSessionA.id,
    status: BookingStatus.Completed,
    price: 85,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  const mathCompleted = await createBooking({
    userId: student.id,
    courseId: mathG12.id,
    sessionId: mathSessionA.id,
    status: BookingStatus.Completed,
    price: 45,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student.id,
    courseId: physicsG11.id,
    sessionId: physicsSession.id,
    status: BookingStatus.Confirmed,
    price: 40,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student.id,
    courseId: englishIelts.id,
    sessionId: ieltsSession.id,
    status: BookingStatus.Pending,
    price: 55,
    paymentStatus: PaymentStatus.Pending,
  });

  await createBooking({
    userId: student.id,
    courseId: pythonIntro.id,
    sessionId: pythonSession.id,
    status: BookingStatus.Confirmed,
    price: 70,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student2.id,
    courseId: mathG12.id,
    sessionId: mathSessionB.id,
    status: BookingStatus.Confirmed,
    price: 45,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student2.id,
    courseId: chemG12.id,
    sessionId: chemSession.id,
    status: BookingStatus.Pending,
    price: 42,
    paymentStatus: PaymentStatus.Pending,
  });

  await createBooking({
    userId: student2.id,
    courseId: englishG10.id,
    sessionId: englishSession.id,
    status: BookingStatus.Confirmed,
    price: 35,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student3.id,
    courseId: itcs347.id,
    sessionId: itcsSessionA.id,
    status: BookingStatus.Confirmed,
    price: 120,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student3.id,
    courseId: itcs347.id,
    sessionId: itcsSessionB.id,
    status: BookingStatus.Pending,
    price: 120,
    paymentStatus: PaymentStatus.Pending,
  });

  await createBooking({
    userId: student3.id,
    courseId: blenderCourse.id,
    sessionId: blenderSessionB.id,
    status: BookingStatus.Confirmed,
    price: 85,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student.id,
    courseId: advancedBlender.id,
    sessionId: advBlenderSession.id,
    status: BookingStatus.Cancelled,
    price: 95,
    paymentStatus: PaymentStatus.Cancelled,
  });

  await prisma.review.create({
    data: {
      bookingId: blenderCompleted.id,
      userId: student.id,
      courseId: blenderCourse.id,
      tutorId: zahra.tutorProfile!.id,
      rating: 5,
      comment: 'Clear lessons and great pacing for absolute beginners.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: mathCompleted.id,
      userId: student.id,
      courseId: mathG12.id,
      tutorId: sara.tutorProfile!.id,
      rating: 5,
      comment: 'Sara explains Grade 12 math with patience and clarity.',
    },
  });

  await prisma.favorite.createMany({
    data: [
      { userId: student.id, courseId: blenderCourse.id },
      { userId: student.id, courseId: itcs347.id },
      { userId: student.id, instituteId: brightMinds.id },
      { userId: student2.id, courseId: mathG12.id },
      { userId: student3.id, courseId: pythonIntro.id },
    ],
  });

  const chatSara = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student.id }, { userId: sara.id }],
      },
      messages: {
        create: [
          {
            senderId: student.id,
            body: 'Hi Sara! Can we review probability before Wednesday?',
            createdAt: daysFromNow(-2, 10),
          },
          {
            senderId: sara.id,
            body: 'Absolutely — I’ll send a short worksheet tonight.',
            createdAt: daysFromNow(-2, 11),
            readAt: daysFromNow(-2, 11),
          },
          {
            senderId: student.id,
            body: 'Perfect, thank you!',
            createdAt: daysFromNow(-1, 9),
            readAt: daysFromNow(-1, 10),
          },
        ],
      },
    },
  });

  const chatZahra = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student.id }, { userId: zahra.id }],
      },
      messages: {
        create: [
          {
            senderId: zahra.id,
            body: 'Welcome to Blender 3D! Install 4.2 before our first session.',
            createdAt: daysFromNow(-3, 14),
            readAt: daysFromNow(-3, 15),
          },
          {
            senderId: student.id,
            body: 'Done — looking forward to modeling basics.',
            createdAt: daysFromNow(-3, 16),
          },
        ],
      },
    },
  });

  const chatOmar = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student2.id }, { userId: omar.id }],
      },
      messages: {
        create: [
          {
            senderId: student2.id,
            body: 'Omar, I’m stuck on Newton’s second law examples.',
            createdAt: daysFromNow(-1, 18),
          },
          {
            senderId: omar.id,
            body: 'Send me the question number and we’ll walk through it tomorrow.',
            createdAt: daysFromNow(-1, 19),
          },
        ],
      },
    },
  });

  const chatLayla = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student3.id }, { userId: layla.id }],
      },
      messages: {
        create: [
          {
            senderId: layla.id,
            body: 'Your Task 2 draft was strong — focus on clearer topic sentences next.',
            createdAt: daysFromNow(-4, 12),
            readAt: daysFromNow(-4, 13),
          },
          {
            senderId: student3.id,
            body: 'Thanks Layla! I’ll revise and send again before the mock.',
            createdAt: daysFromNow(-4, 14),
          },
        ],
      },
    },
  });

  console.log('Seed complete:', {
    tutors: [sara.email, zahra.email, omar.email, layla.email],
    students: [student.email, student2.email, student3.email],
    institutes: [brightMinds.name, codeLab.name, artNest.name],
    courses: 9,
    bookings: 12,
    conversations: [chatSara.id, chatZahra.id, chatOmar.id, chatLayla.id].length,
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
