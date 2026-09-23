export type Role = 'Student' | 'Parent' | 'Tutor' | 'InstituteAdmin' | 'Admin';
export type LanguageCode = 'en' | 'ar';
/** @deprecated use ServiceType */
export type CourseType = 'School' | 'University' | 'Skills' | ServiceType;
export type ServiceType = 'SchoolCourse' | 'UniversityCourse' | 'TrainingSkill';
export type ProviderType = 'Teacher' | 'Institute' | 'Trainer';
export type LearnerType = 'SchoolStudent' | 'UniversityStudent' | 'Individual';
export type CourseFormat = 'Online' | 'InPerson' | 'Hybrid';
export type CourseStatus = 'Draft' | 'Published' | 'Paused' | 'Archived';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Refunded';
export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Paid'
  | 'Failed'
  | 'Refunded'
  | 'Cancelled';
export type VerificationStatus =
  | 'Unverified'
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'Suspended';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  language: LanguageCode | string;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: User;
};

export type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  parentId?: string | null;
};

export type Subject = {
  id: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
};

export type TutorProfile = {
  id: string;
  userId: string;
  bio: string;
  expertise: string[];
  providerType?: ProviderType;
  verificationStatus: VerificationStatus;
  ratingAvg: number;
  ratingCount: number;
  studentCount: number;
  courseCount: number;
};

export type Tutor = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  tutorProfile: TutorProfile | null;
  courses?: Course[];
};

export type Institute = {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  verificationStatus?: VerificationStatus;
  ratingAvg?: number;
  ratingCount?: number;
};

export type CourseSession = {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  seatsAvailable: number;
  seatsTotal?: number;
};

export type CurriculumItem = {
  id: string;
  order: number;
  title: string;
  titleAr?: string | null;
  description?: string | null;
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName'>;
};

export type Course = {
  id: string;
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  categoryId: string;
  subjectId?: string | null;
  serviceType: ServiceType;
  /** @deprecated legacy field — prefer serviceType */
  type?: CourseType;
  level?: string | null;
  grade?: string | null;
  stage?: string | null;
  curriculumName?: string | null;
  courseCode?: string | null;
  major?: string | null;
  skillCategory?: string | null;
  priceDecimal: number | string;
  currency: string;
  durationMinutes?: number | null;
  sessionCount: number;
  capacity: number;
  format: CourseFormat;
  location?: string | null;
  imageUrl?: string | null;
  status: CourseStatus;
  ratingAvg: number;
  ratingCount: number;
  tutorId?: string | null;
  instituteId?: string | null;
  category?: Category;
  subject?: Subject | null;
  tutor?: Tutor | null;
  institute?: Institute | null;
  university?: { id: string; nameEn: string; nameAr: string } | null;
  college?: { id: string; nameEn: string; nameAr: string } | null;
  curriculum?: CurriculumItem[];
  sessions?: CourseSession[];
  reviews?: Review[];
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  provider?: string | null;
  providerRef?: string | null;
  paidAt?: string | null;
};

export type Booking = {
  id: string;
  userId: string;
  courseId: string;
  sessionId: string;
  status: BookingStatus;
  priceSnapshot: number | string;
  currency: string;
  createdAt: string;
  course?: Course;
  session?: CourseSession;
  payment?: Payment | null;
  review?: Review | null;
};

export type Favorite = {
  id: string;
  userId: string;
  courseId?: string | null;
  tutorId?: string | null;
  instituteId?: string | null;
  course?: Course | null;
  institute?: Institute | null;
  createdAt: string;
};

export type ConversationParticipant = {
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  sender?: Pick<User, 'id' | 'firstName' | 'lastName'>;
};

export type Conversation = {
  id: string;
  updatedAt: string;
  courseId?: string | null;
  title?: string | null;
  participants: ConversationParticipant[];
  messages?: Message[];
};
