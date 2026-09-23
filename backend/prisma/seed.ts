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
          bio: 'Computer science tutor specializing in algorithms and school mathematics. Former UoB teaching assistant with 7+ years helping Bahrain students master discrete math, data structures, and exam-ready problem solving. Sessions mix whiteboard walkthroughs, past-paper drills, and weekly progress check-ins.',
          expertise: ['Algorithms', 'Mathematics', 'Data Structures', 'Discrete Math', 'Exam Prep'],
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.8,
          ratingCount: 28,
          studentCount: 86,
          courseCount: 4,
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
          bio: '3D artist and Blender instructor for beginners and creatives. Portfolio spans product viz, short-film look-dev, and game-ready assets. Classes are project-based: you leave with a rendered scene each week, plus critique notes and downloadable starter files.',
          expertise: ['Blender', '3D Modeling', 'Rendering', 'Lighting', 'Look Development'],
          providerType: ProviderType.Trainer,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.9,
          ratingCount: 19,
          studentCount: 54,
          courseCount: 3,
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
          bio: 'Physics and chemistry tutor for Bahrain secondary school students. Explains tough concepts with everyday examples, then locks them in with graded worksheets. Focus areas: mechanics, electricity, organic chemistry, and ministry exam strategy.',
          expertise: ['Physics', 'Chemistry', 'Exam Prep', 'Mechanics', 'Organic Chemistry'],
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.6,
          ratingCount: 33,
          studentCount: 92,
          courseCount: 3,
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
          bio: 'English language coach for school and IELTS preparation. CELTA-certified with a calm, feedback-heavy style. Students practice speaking every session, get annotated writing corrections within 48 hours, and build a personal phrase bank for exams.',
          expertise: ['English', 'IELTS', 'Writing', 'Speaking', 'Academic English'],
          providerType: ProviderType.Teacher,
          verificationStatus: VerificationStatus.Verified,
          ratingAvg: 4.7,
          ratingCount: 41,
          studentCount: 110,
          courseCount: 3,
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
        'University course covering algorithm analysis, design paradigms, and complexity. We work through asymptotic notation, divide-and-conquer, dynamic programming, and classic graph algorithms with weekly coding labs and past ITCS347-style questions. Ideal if you want exam confidence and clearer problem-solving habits.',
      descriptionAr:
        'مقرر جامعي يغطي تحليل الخوارزميات ونماذج التصميم والتعقيد. نتدرّب على الترميز المقارب وخوارزميات فرّق تسد والبرمجة الديناميكية ورسوم البيانات مع مختبرات أسبوعية وأسئلة شبيهة بامتحانات ITCS347.',
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
      ratingCount: 12,
      curriculum: {
        create: [
          {
            order: 1,
            title: 'Asymptotic Analysis',
            titleAr: 'التحليل المقارب',
            description: 'Big-O, Theta, and Omega with worked examples from sorting and searching.',
          },
          {
            order: 2,
            title: 'Divide and Conquer',
            titleAr: 'فرّق تسد',
            description: 'Master theorem, merge sort, closest pair, and recurrence trees.',
          },
          {
            order: 3,
            title: 'Dynamic Programming',
            titleAr: 'البرمجة الديناميكية',
            description: 'Memoization vs tabulation: knapsack, LCS, and path problems.',
          },
          {
            order: 4,
            title: 'Graph Algorithms',
            titleAr: 'خوارزميات الرسوم البيانية',
            description: 'BFS/DFS, shortest paths, MSTs, and topological ordering drills.',
          },
        ],
      },
    },
  });

  const mathG12 = await prisma.course.create({
    data: {
      title: 'Mathematics — Grade 12',
      titleAr: 'الرياضيات — الصف الثاني عشر',
      description:
        'School mathematics tutoring covering Grade 12 curriculum topics — functions, calculus foundations, probability, and exam technique. Each session ends with a short quiz and a homework set aligned to Bahrain ministry past papers.',
      descriptionAr:
        'دروس خصوصية في رياضيات الصف الثاني عشر: الدوال وأساسيات التفاضل والاحتمالات واستراتيجيات الامتحان. كل حصة تنتهي باختبار قصير وواجب مرتبط بأسئلة وزارية.',
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
      ratingCount: 16,
      curriculum: {
        create: [
          {
            order: 1,
            title: 'Functions & Graphs',
            description: 'Domain, range, transformations, and sketching common families.',
          },
          {
            order: 2,
            title: 'Calculus Foundations',
            description: 'Limits intuition, derivatives, and basic applications to rates of change.',
          },
          {
            order: 3,
            title: 'Probability',
            description: 'Counting, conditional probability, and expected value word problems.',
          },
          {
            order: 4,
            title: 'Exam Practice',
            description: 'Timed past-paper blocks with marking-scheme walkthroughs.',
          },
        ],
      },
    },
  });

  const blenderCourse = await prisma.course.create({
    data: {
      title: 'Blender 3D for Beginners',
      titleAr: 'بلندر ثلاثي الأبعاد للمبتدئين',
      description:
        'Learn Blender from scratch: interface, modeling, materials, lighting, and rendering. Project-based — you build a still-life scene, then a simple character prop, with critique after every milestone. Includes starter kits and recommended add-ons for beginners.',
      descriptionAr:
        'تعلّم بلندر من الصفر: الواجهة، النمذجة، المواد، الإضاءة، والإخراج. أسلوب قائم على المشاريع مع مراجعة بعد كل مرحلة، وملفات بداية وإضافات مقترحة للمبتدئين.',
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
      ratingCount: 9,
      curriculum: {
        create: [
          {
            order: 1,
            title: 'Introduction to Blender',
            titleAr: 'مقدمة',
            description: 'Viewport navigation, object mode vs edit mode, and saving habits.',
          },
          {
            order: 2,
            title: 'Modeling Basics',
            titleAr: 'أساسيات النمذجة',
            description: 'Extrude, inset, loop cuts, and clean topology tips.',
          },
          {
            order: 3,
            title: 'Modifiers and Tools',
            titleAr: 'المعدّلات والأدوات',
            description: 'Mirror, subdivision, boolean, and non-destructive workflows.',
          },
          {
            order: 4,
            title: 'Materials and Textures',
            titleAr: 'المواد والملمس',
            description: 'Principled BSDF, UV unwrap basics, and simple procedural textures.',
          },
          {
            order: 5,
            title: 'Lighting and Rendering',
            titleAr: 'الإضاءة والإخراج',
            description: 'Three-point lighting, camera framing, and Cycles vs Eevee export.',
          },
        ],
      },
    },
  });

  const physicsG11 = await prisma.course.create({
    data: {
      title: 'Physics — Grade 11',
      titleAr: 'الفيزياء — الصف الحادي عشر',
      description:
        'Mechanics, waves, and electricity aligned to the Bahrain Grade 11 syllabus. Lessons alternate concept demos with guided problem sets so you can spot formula mix-ups early. Includes formula sheets and a mid-course mock quiz.',
      descriptionAr:
        'ميكانيكا وموجات وكهرباء وفق منهج الصف الحادي عشر في البحرين. نمزج الشرح مع تمارين موجّهة ونقدّم ملخص قوانين واختبارًا منتصف الدورة.',
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
      ratingCount: 14,
      curriculum: {
        create: [
          { order: 1, title: 'Kinematics', description: 'Displacement, velocity, acceleration graphs.' },
          { order: 2, title: 'Newton’s Laws', description: 'Free-body diagrams and multi-force problems.' },
          { order: 3, title: 'Work & Energy', description: 'Conservation, power, and spring energy.' },
          { order: 4, title: 'Waves', description: 'Wave speed, interference, and sound basics.' },
          { order: 5, title: 'Electric Circuits', description: 'Ohm’s law, series/parallel, and meters.' },
        ],
      },
    },
  });

  const chemG12 = await prisma.course.create({
    data: {
      title: 'Chemistry — Grade 12',
      titleAr: 'الكيمياء — الصف الثاني عشر',
      description:
        'Organic chemistry and exam drills for Grade 12 students. We map functional groups, walk reaction mechanisms step-by-step, and finish with timed past-paper blocks plus lab safety refreshers.',
      descriptionAr:
        'كيمياء عضوية وتمارين امتحانات للصف الثاني عشر. نغطي المجموعات الوظيفية وآليات التفاعلات واختبارات زمنية مع مراجعة سلامة المختبر.',
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
      ratingCount: 11,
      curriculum: {
        create: [
          { order: 1, title: 'Organic Basics', description: 'Nomenclature, isomers, and functional groups.' },
          { order: 2, title: 'Reaction Mechanisms', description: 'Substitution, addition, and elimination patterns.' },
          { order: 3, title: 'Lab Skills', description: 'Titration practice, observations, and error analysis.' },
          { order: 4, title: 'Past Papers', description: 'Ministry-style papers with mark-scheme coaching.' },
        ],
      },
    },
  });

  const englishIelts = await prisma.course.create({
    data: {
      title: 'IELTS Speaking & Writing',
      titleAr: 'آيلتس — المحادثة والكتابة',
      description:
        'Targeted IELTS practice for Speaking and Writing bands 6.5+. Recorded speaking drills, annotated essay feedback within 48 hours, and a full mock in the final week with band estimates.',
      descriptionAr:
        'تدريب مركّز على المحادثة والكتابة لآيلتس بمستوى 6.5 فأعلى. تسجيلات محادثة وتصحيح مقالات خلال 48 ساعة واختبار تجريبي في الأسبوع الأخير.',
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
      ratingCount: 22,
      curriculum: {
        create: [
          { order: 1, title: 'Speaking Part 1–2', description: 'Fluency warm-ups and cue-card structuring.' },
          { order: 2, title: 'Speaking Part 3', description: 'Opinion language and extended answers.' },
          { order: 3, title: 'Task 1 Writing', description: 'Charts, processes, and comparison language.' },
          { order: 4, title: 'Task 2 Essays', description: 'Thesis clarity, cohesion, and band descriptors.' },
          { order: 5, title: 'Mock Exam', description: 'Timed speaking + writing with band estimate.' },
        ],
      },
    },
  });

  const pythonIntro = await prisma.course.create({
    data: {
      title: 'Python Programming for Beginners',
      titleAr: 'بايثون للمبتدئين',
      description:
        'Learn Python fundamentals with hands-on exercises and mini projects. We cover variables, control flow, functions, and collections, then build a small CLI app together. Notebooks and solutions are shared after every class.',
      descriptionAr:
        'تعلّم أساسيات بايثون بتمارين عملية ومشاريع صغيرة: المتغيرات والتدفق والدوال والمجموعات ثم تطبيق سطر أوامر بسيط مع ملفات حلول بعد كل حصة.',
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
      ratingCount: 18,
      curriculum: {
        create: [
          { order: 1, title: 'Variables & Types', description: 'Ints, floats, strings, and type casting pitfalls.' },
          { order: 2, title: 'Control Flow', description: 'if/else, loops, and common off-by-one bugs.' },
          { order: 3, title: 'Functions', description: 'Parameters, return values, and scope.' },
          { order: 4, title: 'Lists & Dicts', description: 'Mutability, comprehensions, and nested data.' },
          { order: 5, title: 'Mini Project', description: 'Build a small CLI tool and present it.' },
        ],
      },
    },
  });

  const englishG10 = await prisma.course.create({
    data: {
      title: 'English — Grade 10',
      titleAr: 'اللغة الإنجليزية — الصف العاشر',
      description:
        'Reading comprehension, grammar, and writing for Grade 10. Short texts each week, grammar drills that stick, and paragraph writing with teacher annotations.',
      descriptionAr:
        'فهم المقروء والقواعد والكتابة للصف العاشر. نصوص قصيرة أسبوعيًا وتمارين قواعد وكتابة فقرات مع تصحيح المعلّمة.',
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
      ratingCount: 8,
      curriculum: {
        create: [
          { order: 1, title: 'Reading Skills', description: 'Skimming, scanning, and inference practice.' },
          { order: 2, title: 'Grammar Review', description: 'Tenses, articles, and common error patterns.' },
          { order: 3, title: 'Paragraph Writing', description: 'Topic sentences, support, and concluding lines.' },
          { order: 4, title: 'Oral Practice', description: 'Short presentations and classroom discussion.' },
        ],
      },
    },
  });

  const advancedBlender = await prisma.course.create({
    data: {
      title: 'Advanced Blender Lighting',
      titleAr: 'إضاءة بلندر المتقدمة',
      description:
        'Cinematic lighting, HDRI setups, and Cycles optimization. Built for students who already know Blender basics and want portfolio-ready lighting and look-dev workflows.',
      descriptionAr:
        'إضاءة سينمائية وإعدادات HDRI وتحسين Cycles لمن يجيد أساسيات بلندر ويريد مشاهد جاهزة للمعرض.',
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
      ratingCount: 5,
      curriculum: {
        create: [
          { order: 1, title: 'Light Types', description: 'Area, spot, sun, and when to mix them.' },
          { order: 2, title: 'HDRI Worlds', description: 'Environment maps, strength, and rotation.' },
          { order: 3, title: 'Look Development', description: 'Materials under different lighting moods.' },
          { order: 4, title: 'Render Passes', description: 'Denoising, compositing, and export checklist.' },
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
    itcsSessionC,
    mathSessionPast,
    mathSessionA,
    mathSessionB,
    blenderSessionPast,
    blenderSessionA,
    blenderSessionB,
    physicsSessionPast,
    physicsSession,
    physicsSessionB,
    chemSession,
    chemSessionB,
    ieltsSession,
    ieltsSessionB,
    pythonSessionPast,
    pythonSession,
    pythonSessionB,
    englishSession,
    englishSessionB,
    advBlenderSession,
    laylaIeltsPast,
  ] = await Promise.all([
    makeSession(itcs347.id, daysFromNow(2, 17), 25),
    makeSession(itcs347.id, daysFromNow(9, 17), 25),
    makeSession(itcs347.id, daysFromNow(16, 17), 25),
    makeSession(mathG12.id, daysFromNow(-10, 18), 8, 60),
    makeSession(mathG12.id, daysFromNow(1, 18), 8, 60),
    makeSession(mathG12.id, daysFromNow(8, 18), 8, 60),
    makeSession(blenderCourse.id, daysFromNow(-14, 19), 10, 120),
    makeSession(blenderCourse.id, daysFromNow(3, 19), 10, 120),
    makeSession(blenderCourse.id, daysFromNow(17, 19), 10, 120),
    makeSession(physicsG11.id, daysFromNow(-7, 16), 12, 60),
    makeSession(physicsG11.id, daysFromNow(2, 16), 12, 60),
    makeSession(physicsG11.id, daysFromNow(9, 16), 12, 60),
    makeSession(chemG12.id, daysFromNow(4, 17), 10, 60),
    makeSession(chemG12.id, daysFromNow(11, 17), 10, 60),
    makeSession(englishIelts.id, daysFromNow(3, 20), 8, 75),
    makeSession(englishIelts.id, daysFromNow(10, 20), 8, 75),
    makeSession(pythonIntro.id, daysFromNow(-5, 18), 20),
    makeSession(pythonIntro.id, daysFromNow(5, 18), 20),
    makeSession(pythonIntro.id, daysFromNow(12, 18), 20),
    makeSession(englishG10.id, daysFromNow(1, 15), 12, 55),
    makeSession(englishG10.id, daysFromNow(8, 15), 12, 55),
    makeSession(advancedBlender.id, daysFromNow(14, 19), 8, 120),
    makeSession(englishIelts.id, daysFromNow(-12, 20), 8, 75),
  ]);

  const makeCourseGroup = async (courseId: string, title: string, memberIds: string[]) => {
    const unique = [...new Set(memberIds)];
    return prisma.conversation.create({
      data: {
        courseId,
        title,
        participants: { create: unique.map((userId) => ({ userId })) },
      },
    });
  };

  await Promise.all([
    makeCourseGroup(mathG12.id, mathG12.title, [sara.id, student.id, student2.id]),
    makeCourseGroup(blenderCourse.id, blenderCourse.title, [zahra.id, student.id, student3.id]),
    makeCourseGroup(physicsG11.id, physicsG11.title, [omar.id, student.id]),
    makeCourseGroup(pythonIntro.id, pythonIntro.title, [sara.id, student.id]),
    makeCourseGroup(englishIelts.id, englishIelts.title, [layla.id, student.id]),
    makeCourseGroup(itcs347.id, itcs347.title, [sara.id, student3.id]),
    makeCourseGroup(chemG12.id, chemG12.title, [omar.id, student2.id]),
    makeCourseGroup(englishG10.id, englishG10.title, [layla.id, student2.id]),
    makeCourseGroup(advancedBlender.id, advancedBlender.title, [zahra.id]),
  ]);

  const groupMath = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: mathG12.id },
  });
  const groupBlender = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: blenderCourse.id },
  });
  const groupPhysics = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: physicsG11.id },
  });
  const groupPython = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: pythonIntro.id },
  });
  const groupIelts = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: englishIelts.id },
  });
  const groupItcs = await prisma.conversation.findUniqueOrThrow({
    where: { courseId: itcs347.id },
  });

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
    sessionId: blenderSessionPast.id,
    status: BookingStatus.Completed,
    price: 85,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  const mathCompleted = await createBooking({
    userId: student.id,
    courseId: mathG12.id,
    sessionId: mathSessionPast.id,
    status: BookingStatus.Completed,
    price: 45,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  const physicsCompleted = await createBooking({
    userId: student.id,
    courseId: physicsG11.id,
    sessionId: physicsSessionPast.id,
    status: BookingStatus.Completed,
    price: 40,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  const pythonCompleted = await createBooking({
    userId: student.id,
    courseId: pythonIntro.id,
    sessionId: pythonSessionPast.id,
    status: BookingStatus.Completed,
    price: 70,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  const ieltsCompleted = await createBooking({
    userId: student.id,
    courseId: englishIelts.id,
    sessionId: laylaIeltsPast.id,
    status: BookingStatus.Completed,
    price: 55,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  // Upcoming for demo student (earliest shows on home)
  await createBooking({
    userId: student.id,
    courseId: mathG12.id,
    sessionId: mathSessionA.id,
    status: BookingStatus.Confirmed,
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
    courseId: blenderCourse.id,
    sessionId: blenderSessionA.id,
    status: BookingStatus.Confirmed,
    price: 85,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student.id,
    courseId: englishIelts.id,
    sessionId: ieltsSession.id,
    status: BookingStatus.Confirmed,
    price: 55,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
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
    userId: student.id,
    courseId: pythonIntro.id,
    sessionId: pythonSessionB.id,
    status: BookingStatus.Pending,
    price: 70,
    paymentStatus: PaymentStatus.Pending,
  });

  const mathCompleted2 = await createBooking({
    userId: student2.id,
    courseId: mathG12.id,
    sessionId: mathSessionPast.id,
    status: BookingStatus.Completed,
    price: 45,
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
    userId: student2.id,
    courseId: chemG12.id,
    sessionId: chemSessionB.id,
    status: BookingStatus.Confirmed,
    price: 42,
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
    status: BookingStatus.Confirmed,
    price: 120,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student3.id,
    courseId: itcs347.id,
    sessionId: itcsSessionC.id,
    status: BookingStatus.Pending,
    price: 120,
    paymentStatus: PaymentStatus.Pending,
  });

  const blenderCompleted3 = await createBooking({
    userId: student3.id,
    courseId: blenderCourse.id,
    sessionId: blenderSessionPast.id,
    status: BookingStatus.Completed,
    price: 85,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
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

  await createBooking({
    userId: student.id,
    courseId: physicsG11.id,
    sessionId: physicsSessionB.id,
    status: BookingStatus.Confirmed,
    price: 40,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student2.id,
    courseId: englishG10.id,
    sessionId: englishSessionB.id,
    status: BookingStatus.Confirmed,
    price: 35,
    paymentStatus: PaymentStatus.Paid,
    paid: true,
  });

  await createBooking({
    userId: student.id,
    courseId: englishIelts.id,
    sessionId: ieltsSessionB.id,
    status: BookingStatus.Pending,
    price: 55,
    paymentStatus: PaymentStatus.Pending,
  });

  await prisma.review.createMany({
    data: [
      {
        bookingId: blenderCompleted.id,
        userId: student.id,
        courseId: blenderCourse.id,
        tutorId: zahra.tutorProfile!.id,
        rating: 5,
        comment:
          'Clear lessons and great pacing for absolute beginners. Zahra’s project feedback was specific and kind.',
      },
      {
        bookingId: mathCompleted.id,
        userId: student.id,
        courseId: mathG12.id,
        tutorId: sara.tutorProfile!.id,
        rating: 5,
        comment:
          'Sara explains Grade 12 math with patience and clarity. The past-paper drills made a huge difference.',
      },
      {
        bookingId: physicsCompleted.id,
        userId: student.id,
        courseId: physicsG11.id,
        tutorId: omar.tutorProfile!.id,
        rating: 4,
        comment:
          'Omar breaks mechanics into steps that finally clicked. Would love even more practice worksheets.',
      },
      {
        bookingId: pythonCompleted.id,
        userId: student.id,
        courseId: pythonIntro.id,
        tutorId: sara.tutorProfile!.id,
        rating: 5,
        comment: 'Hands-on from minute one. The mini project felt like real coding, not just slides.',
      },
      {
        bookingId: ieltsCompleted.id,
        userId: student.id,
        courseId: englishIelts.id,
        tutorId: layla.tutorProfile!.id,
        rating: 5,
        comment:
          'Layla’s speaking feedback was gold. My cue-card answers got much more structured after two weeks.',
      },
      {
        bookingId: mathCompleted2.id,
        userId: student2.id,
        courseId: mathG12.id,
        tutorId: sara.tutorProfile!.id,
        rating: 4,
        comment: 'Solid exam prep. Probability week was intense but worth it.',
      },
      {
        bookingId: blenderCompleted3.id,
        userId: student3.id,
        courseId: blenderCourse.id,
        tutorId: zahra.tutorProfile!.id,
        rating: 5,
        comment: 'Best intro to Blender I’ve tried online. Lighting tips alone were worth it.',
      },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { userId: student.id, courseId: blenderCourse.id },
      { userId: student.id, courseId: itcs347.id },
      { userId: student.id, courseId: englishIelts.id },
      { userId: student.id, tutorId: sara.tutorProfile!.id },
      { userId: student.id, instituteId: brightMinds.id },
      { userId: student2.id, courseId: mathG12.id },
      { userId: student2.id, tutorId: omar.tutorProfile!.id },
      { userId: student3.id, courseId: pythonIntro.id },
      { userId: student3.id, courseId: itcs347.id },
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
          {
            senderId: sara.id,
            body: 'Worksheet is in your email. Try Q1–Q6 before class and we’ll tackle the rest live.',
            createdAt: daysFromNow(-1, 14),
          },
          {
            senderId: student.id,
            body: 'Got it — stuck a bit on conditional probability in Q4.',
            createdAt: daysFromNow(0, 9),
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
            readAt: daysFromNow(-3, 17),
          },
          {
            senderId: zahra.id,
            body: 'Great. Bring a still-life photo you’d like to recreate — fruit or a desk setup works.',
            createdAt: daysFromNow(-2, 11),
          },
          {
            senderId: student.id,
            body: 'I’ll use a coffee mug and plant on my desk ☕',
            createdAt: daysFromNow(-1, 20),
          },
        ],
      },
    },
  });

  const chatOmar = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student.id }, { userId: omar.id }],
      },
      messages: {
        create: [
          {
            senderId: student.id,
            body: 'Omar, can we spend extra time on free-body diagrams tomorrow?',
            createdAt: daysFromNow(-1, 17),
          },
          {
            senderId: omar.id,
            body: 'Yes — I’ll open with two pulley examples, then we’ll do yours.',
            createdAt: daysFromNow(-1, 18),
            readAt: daysFromNow(-1, 18),
          },
          {
            senderId: student.id,
            body: 'Awesome, see you then.',
            createdAt: daysFromNow(0, 8),
          },
        ],
      },
    },
  });

  const chatOmar2 = await prisma.conversation.create({
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
        create: [{ userId: student.id }, { userId: layla.id }],
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
            senderId: student.id,
            body: 'Thanks Layla! I’ll revise and send again before the mock.',
            createdAt: daysFromNow(-4, 14),
            readAt: daysFromNow(-4, 15),
          },
          {
            senderId: layla.id,
            body: 'Also practice paraphrasing the question in your intro — that alone lifts cohesion.',
            createdAt: daysFromNow(-2, 16),
          },
          {
            senderId: student.id,
            body: 'Noted. I’ll send the new draft tonight.',
            createdAt: daysFromNow(-1, 21),
          },
        ],
      },
    },
  });

  const chatLaylaYusuf = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: student3.id }, { userId: layla.id }],
      },
      messages: {
        create: [
          {
            senderId: student3.id,
            body: 'Layla, do you have tips for Speaking Part 3 follow-ups?',
            createdAt: daysFromNow(-3, 10),
          },
          {
            senderId: layla.id,
            body: 'Answer, expand with a reason, then give a short example. Keep it under 40 seconds.',
            createdAt: daysFromNow(-3, 11),
            readAt: daysFromNow(-3, 12),
          },
        ],
      },
    },
  });

  // Course group messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: groupMath.id,
        senderId: sara.id,
        body: 'Welcome to Mathematics — Grade 12! Upload your calculator model in the chat if you’re unsure about exam settings.',
        createdAt: daysFromNow(-5, 12),
        readAt: daysFromNow(-5, 13),
      },
      {
        conversationId: groupMath.id,
        senderId: student2.id,
        body: 'Using a Casio fx-991EX — is that fine?',
        createdAt: daysFromNow(-5, 13),
        readAt: daysFromNow(-5, 14),
      },
      {
        conversationId: groupMath.id,
        senderId: sara.id,
        body: 'Yes. Tonight’s worksheet covers functions — due before tomorrow’s class.',
        createdAt: daysFromNow(-1, 19),
      },
      {
        conversationId: groupBlender.id,
        senderId: zahra.id,
        body: 'Group note: render samples at 128 for drafts, 512 for finals. Don’t spam the GPU overnight 😅',
        createdAt: daysFromNow(-4, 15),
        readAt: daysFromNow(-4, 16),
      },
      {
        conversationId: groupBlender.id,
        senderId: student.id,
        body: 'Thanks! My mug model is ready for critique.',
        createdAt: daysFromNow(-2, 20),
      },
      {
        conversationId: groupPhysics.id,
        senderId: omar.id,
        body: 'Physics crew — bring your formula sheet tomorrow. We’ll stress-test kinematics graphs.',
        createdAt: daysFromNow(-1, 16),
      },
      {
        conversationId: groupPython.id,
        senderId: sara.id,
        body: 'Python group: push your list/dict exercises to the shared folder before Sunday.',
        createdAt: daysFromNow(-2, 18),
        readAt: daysFromNow(-2, 19),
      },
      {
        conversationId: groupPython.id,
        senderId: student.id,
        body: 'Uploaded mine — can someone review the dictionary nesting?',
        createdAt: daysFromNow(-1, 22),
      },
      {
        conversationId: groupIelts.id,
        senderId: layla.id,
        body: 'IELTS cohort: practice cue cards for 2 minutes daily this week. Record yourself.',
        createdAt: daysFromNow(-3, 9),
        readAt: daysFromNow(-3, 10),
      },
      {
        conversationId: groupItcs.id,
        senderId: sara.id,
        body: 'ITCS347: dynamic programming homework is up. Office hours Thursday after class.',
        createdAt: daysFromNow(-2, 17),
      },
      {
        conversationId: groupItcs.id,
        senderId: student3.id,
        body: 'Is memoization required for the knapsack write-up?',
        createdAt: daysFromNow(-1, 11),
      },
      {
        conversationId: groupItcs.id,
        senderId: sara.id,
        body: 'Show both approaches — tabulation is enough for the grade, memoization gets bonus clarity.',
        createdAt: daysFromNow(0, 10),
      },
    ],
  });

  console.log('Seed complete:', {
    tutors: [sara.email, zahra.email, omar.email, layla.email],
    students: [student.email, student2.email, student3.email],
    institutes: [brightMinds.name, codeLab.name, artNest.name],
    courses: 9,
    reviews: 7,
    password: 'Password123!',
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
