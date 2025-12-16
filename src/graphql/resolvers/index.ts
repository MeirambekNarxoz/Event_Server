import { GraphQLScalarType } from 'graphql';
import { authResolvers } from './auth';
import { eventResolvers } from './event';
import { registrationResolvers } from './registration';
import { commentResolvers } from './comment';
import { subscriptionResolvers } from './subscription';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize: (value: any) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue: (value: any) => {
    return new Date(value);
  },
  parseLiteral: (ast: any) => {
    return new Date(ast.value);
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    ...authResolvers.Query,
    ...eventResolvers.Query,
    ...registrationResolvers.Query,
    ...commentResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...eventResolvers.Mutation,
    ...registrationResolvers.Mutation,
    ...commentResolvers.Mutation,
  },
  Subscription: {
    ...subscriptionResolvers.Subscription,
  },
  User: authResolvers.User,
  Event: eventResolvers.Event,
  Registration: registrationResolvers.Registration,
  Comment: commentResolvers.Comment,
};

