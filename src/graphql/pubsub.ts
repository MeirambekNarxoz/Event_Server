import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();
// SubscriptionEvent — список имён
export enum SubscriptionEvent {
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  REGISTRATION_CREATED = 'REGISTRATION_CREATED',
  REGISTRATION_UPDATED = 'REGISTRATION_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}