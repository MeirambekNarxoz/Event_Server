import { withFilter } from 'graphql-subscriptions';
import { pubsub, SubscriptionEvent } from '../pubsub';

export const subscriptionResolvers = {
  Subscription: {
    eventCreated: {
      subscribe: () => pubsub.asyncIterator([SubscriptionEvent.EVENT_CREATED]),
    },

    eventUpdated: {
      subscribe: () => pubsub.asyncIterator([SubscriptionEvent.EVENT_UPDATED]),
    },

    registrationCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionEvent.REGISTRATION_CREATED]),
        (payload, variables) => {
          return payload.registrationCreated.eventId.toString() === variables.eventId;
        }
      ),
    },

    registrationUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionEvent.REGISTRATION_UPDATED]),
        (payload, variables) => {
          return payload.registrationUpdated.eventId.toString() === variables.eventId;
        }
      ),
    },

    commentAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionEvent.COMMENT_ADDED]),
        (payload, variables) => {
          return payload.commentAdded.eventId.toString() === variables.eventId;
        }
      ),
    },
  },
};

