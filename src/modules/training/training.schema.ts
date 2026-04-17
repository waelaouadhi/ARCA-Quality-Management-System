export const trainingTypeDefs = `#graphql
  enum TrainingType {
    MANDATORY
    OPTIONAL
    COMPLIANCE
    TECHNICAL
    SOFT_SKILLS
  }

  enum TrainingStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    FAILED
    CANCELLED
  }

  enum DeliveryMethod {
    IN_PERSON
    ONLINE
    HYBRID
  }

  enum CertificationStatus {
    VALID
    EXPIRED
    PENDING_RENEWAL
    REVOKED
  }

  enum CompetencyLevel {
    BASIC
    INTERMEDIATE
    ADVANCED
  }

  type TrainingProgram {
    id: ID!
    programNumber: String!
    name: String!
    description: String!
    type: TrainingType!
    requiredCompetencies: [String!]!
    durationHours: Float!
    targetAudience: String
    status: String!
    isActive: Boolean!
    courses: [TrainingCourse!]!
    schedules: [TrainingSchedule!]!
    createdAt: String!
    updatedAt: String!
  }

  type TrainingCourse {
    id: ID!
    courseNumber: String!
    name: String!
    description: String!
    content: String
    durationHours: Float!
    numberOfModules: Int!
    instructor: User
    instructorId: String
    program: TrainingProgram!
    programId: String!
    targetCompetency: String
    competencyLevel: CompetencyLevel
    status: String!
    isActive: Boolean!
    schedules: [TrainingSchedule!]!
    enrollments: [EmployeeTraining!]!
    createdAt: String!
    updatedAt: String!
  }

  type TrainingSchedule {
    id: ID!
    scheduleNumber: String!
    course: TrainingCourse!
    courseId: String!
    program: TrainingProgram!
    programId: String!
    startDate: String!
    endDate: String!
    startTime: String
    endTime: String
    location: String
    deliveryMethod: DeliveryMethod!
    maxParticipants: Int!
    currentEnrollment: Int!
    status: String!
    enrollments: [EmployeeTraining!]!
    createdAt: String!
    updatedAt: String!
  }

  type EmployeeTraining {
    id: ID!
    enrollmentNumber: String!
    employee: User!
    employeeId: String!
    schedule: TrainingSchedule!
    scheduleId: String!
    course: TrainingCourse!
    courseId: String!
    program: TrainingProgram!
    programId: String!
    status: TrainingStatus!
    enrolledDate: String!
    completedDate: String
    attendanceHours: Float!
    score: Float
    gradeReceived: String
    feedback: String
    certificateUrl: String
    certificateIssuedDate: String
    assignedBy: String
    assignedDate: String
    dueDate: String
    createdAt: String!
    updatedAt: String!
  }

  type TrainingCertification {
    id: ID!
    certNumber: String!
    employee: User!
    employeeId: String!
    certificationName: String!
    issuingBody: String
    certificationCode: String
    issuedDate: String!
    expiryDate: String
    renewalDate: String
    status: CertificationStatus!
    program: TrainingProgram
    programId: String
    documentUrl: String
    documentType: String
    createdAt: String!
    updatedAt: String!
  }

  type EmployeeCompetencies {
    completedTrainings: Int!
    certifications: [TrainingCertification!]!
    enrolledPrograms: [TrainingProgram!]!
  }

  type ScheduleEnrollmentStats {
    totalEnrolled: Int!
    completed: Int!
    inProgress: Int!
    pending: Int!
    failed: Int!
  }

  type ScheduleStatistics {
    schedule: TrainingSchedule!
    stats: ScheduleEnrollmentStats!
  }

  type TrainingProgramPayload {
    success: Boolean!
    message: String
    data: TrainingProgram
  }

  type TrainingCoursePayload {
    success: Boolean!
    message: String
    data: TrainingCourse
  }

  type TrainingSchedulePayload {
    success: Boolean!
    message: String
    data: TrainingSchedule
  }

  type EmployeeTrainingPayload {
    success: Boolean!
    message: String
    data: EmployeeTraining
  }

  type TrainingCertificationPayload {
    success: Boolean!
    message: String
    data: TrainingCertification
  }

  type TrainingProgramList {
    data: [TrainingProgram!]!
    total: Int!
  }

  type TrainingCourseList {
    data: [TrainingCourse!]!
    total: Int!
  }

  type TrainingScheduleList {
    data: [TrainingSchedule!]!
    total: Int!
  }

  type EmployeeTrainingList {
    data: [EmployeeTraining!]!
    total: Int!
  }

  type TrainingCertificationList {
    data: [TrainingCertification!]!
    total: Int!
  }

  extend type Query {
    # Training Programs
    trainingProgram(id: ID!): TrainingProgram
    listTrainingPrograms(
      type: TrainingType
      status: String
      searchQuery: String
      skip: Int
      take: Int
    ): TrainingProgramList!

    # Training Courses
    trainingCourse(id: ID!): TrainingCourse
    listTrainingCourses(
      programId: ID
      status: String
      competencyLevel: CompetencyLevel
      searchQuery: String
      skip: Int
      take: Int
    ): TrainingCourseList!

    # Training Schedules
    trainingSchedule(id: ID!): TrainingSchedule
    listTrainingSchedules(
      courseId: ID
      programId: ID
      status: String
      deliveryMethod: DeliveryMethod
      startDate: String
      endDate: String
      skip: Int
      take: Int
    ): TrainingScheduleList!

    # Employee Training
    employeeTraining(id: ID!): EmployeeTraining
    listEmployeeTrainings(
      employeeId: ID
      scheduleId: ID
      courseId: ID
      programId: ID
      status: TrainingStatus
      skip: Int
      take: Int
    ): EmployeeTrainingList!

    # Certifications
    trainingCertification(id: ID!): TrainingCertification
    listTrainingCertifications(
      employeeId: ID
      status: CertificationStatus
      programId: ID
      searchQuery: String
      skip: Int
      take: Int
    ): TrainingCertificationList!

    # Analytics
    employeeCompetencies(employeeId: ID!): EmployeeCompetencies!
    scheduleStatistics(scheduleId: ID!): ScheduleStatistics!
    expiringCertifications(days: Int): [TrainingCertification!]!
  }

  extend type Mutation {
    # Training Programs
    createTrainingProgram(
      name: String!
      description: String!
      type: TrainingType
      requiredCompetencies: [String!]
      durationHours: Float!
      targetAudience: String
    ): TrainingProgramPayload!

    updateTrainingProgram(
      id: ID!
      name: String
      description: String
      type: TrainingType
      requiredCompetencies: [String!]
      durationHours: Float
      targetAudience: String
      status: String
    ): TrainingProgramPayload!

    deleteTrainingProgram(id: ID!): TrainingProgramPayload!

    # Training Courses
    createTrainingCourse(
      name: String!
      description: String!
      content: String
      durationHours: Float!
      numberOfModules: Int
      instructorId: ID
      programId: ID!
      targetCompetency: String
      competencyLevel: CompetencyLevel
    ): TrainingCoursePayload!

    updateTrainingCourse(
      id: ID!
      name: String
      description: String
      content: String
      durationHours: Float
      numberOfModules: Int
      instructorId: ID
      targetCompetency: String
      competencyLevel: CompetencyLevel
      status: String
    ): TrainingCoursePayload!

    deleteTrainingCourse(id: ID!): TrainingCoursePayload!

    # Training Schedules
    createTrainingSchedule(
      courseId: ID!
      programId: ID!
      startDate: String!
      endDate: String!
      startTime: String
      endTime: String
      location: String
      deliveryMethod: DeliveryMethod
      maxParticipants: Int
    ): TrainingSchedulePayload!

    updateTrainingSchedule(
      id: ID!
      startDate: String
      endDate: String
      startTime: String
      endTime: String
      location: String
      deliveryMethod: DeliveryMethod
      maxParticipants: Int
      status: String
    ): TrainingSchedulePayload!

    deleteTrainingSchedule(id: ID!): TrainingSchedulePayload!

    # Employee Training
    enrollEmployee(
      employeeId: ID!
      scheduleId: ID!
      dueDate: String
    ): EmployeeTrainingPayload!

    completeTraining(
      enrollmentId: ID!
      attendanceHours: Float
      score: Float
      gradeReceived: String
      feedback: String
      certificateUrl: String
    ): EmployeeTrainingPayload!

    updateEnrollmentStatus(
      enrollmentId: ID!
      status: TrainingStatus!
    ): EmployeeTrainingPayload!

    unenrollEmployee(enrollmentId: ID!): EmployeeTrainingPayload!

    # Certifications
    createTrainingCertification(
      employeeId: ID!
      certificationName: String!
      issuingBody: String
      certificationCode: String
      issuedDate: String!
      expiryDate: String
      programId: ID
      documentUrl: String
      documentType: String
    ): TrainingCertificationPayload!

    updateTrainingCertification(
      id: ID!
      certificationName: String
      issuingBody: String
      certificationCode: String
      issuedDate: String
      expiryDate: String
      renewalDate: String
      status: CertificationStatus
      documentUrl: String
      documentType: String
    ): TrainingCertificationPayload!

    deleteTrainingCertification(id: ID!): TrainingCertificationPayload!
  }
`;
