import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    avatar: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserRole {
    USER
    ORGANIZER
    ADMIN
  }

  type Event {
    id: ID!
    title: String!
    description: String!
    date: DateTime!
    location: String!
    capacity: Int!
    organizerId: ID!
    organizer: User!
    status: EventStatus!
    category: EventCategory!
    imageUrl: String
    registrationsCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum EventStatus {
    DRAFT
    PUBLISHED
    CANCELLED
    COMPLETED
  }

  enum EventCategory {
    CONFERENCE
    WORKSHOP
    SEMINAR
    NETWORKING
    CONCERT
    SPORTS
    OTHER
  }

  type Registration {
    id: ID!
    userId: ID!
    user: User!
    eventId: ID!
    event: Event!
    status: RegistrationStatus!
    registeredAt: DateTime!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum RegistrationStatus {
    PENDING
    CONFIRMED
    CANCELLED
    ATTENDED
  }

  type Comment {
    id: ID!
    userId: ID!
    user: User!
    eventId: ID!
    event: Event!
    content: String!
    rating: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: UserRole
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateEventInput {
    title: String!
    description: String!
    date: DateTime!
    location: String!
    capacity: Int!
    category: EventCategory!
    imageUrl: String
  }

  input UpdateEventInput {
    title: String
    description: String
    date: DateTime
    location: String
    capacity: Int
    category: EventCategory
    imageUrl: String
    status: EventStatus
  }

  input CreateRegistrationInput {
    eventId: ID!
    notes: String
  }

  input UpdateRegistrationInput {
    status: RegistrationStatus
    notes: String
  }

  input CreateCommentInput {
    eventId: ID!
    content: String!
    rating: Int
  }

  input UpdateCommentInput {
    content: String
    rating: Int
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Event queries
    events(
      status: EventStatus
      category: EventCategory
      limit: Int
      offset: Int
    ): [Event!]!
    event(id: ID!): Event
    myEvents: [Event!]!

    # Registration queries
    registrations(eventId: ID, userId: ID): [Registration!]!
    registration(id: ID!): Registration
    myRegistrations: [Registration!]!

    # Comment queries
    comments(eventId: ID!): [Comment!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Event mutations
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!

    # Registration mutations
    createRegistration(input: CreateRegistrationInput!): Registration!
    updateRegistration(id: ID!, input: UpdateRegistrationInput!): Registration!
    cancelRegistration(id: ID!): Registration!

    # Comment mutations
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, input: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  type Subscription {
    # Event subscriptions
    eventCreated: Event!
    eventUpdated: Event!
    
    # Registration subscriptions
    registrationCreated(eventId: ID!): Registration!
    registrationUpdated(eventId: ID!): Registration!
    
    # Comment subscriptions
    commentAdded(eventId: ID!): Comment!
  }
`;

