import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { requireAuth, Context } from '../../utils/context';
import { handleError } from '../../utils/errors';
import {
  createEventInputSchema,
  updateEventInputSchema,
} from '../../utils/validation';
import { pubsub, SubscriptionEvent } from '../pubsub';

export const eventResolvers = {
  Query: {
    events: async (
      _: any,
      {
        status,
        category,
        limit = 50,
        offset = 0,
      }: { status?: string; category?: string; limit?: number; offset?: number },
      context: Context
    ) => {
      try {
        const query: any = { isDeleted: false };
        if (status) query.status = status;
        if (category) query.category = category;

        const events = await Event.find(query)
          .populate('organizerId', 'name email avatar')
          .sort({ date: 1 })
          .limit(limit)
          .skip(offset)
          .lean();

        // Add registrations count and convert _id to id
        const eventsWithCounts = await Promise.all(
          events.map(async (event) => {
            const count = await Registration.countDocuments({
              eventId: event._id,
              status: { $in: ['PENDING', 'CONFIRMED'] },
              isDeleted: false,
            });
            return { 
              ...event, 
              id: event._id.toString(),
              registrationsCount: count 
            };
          })
        );

        return eventsWithCounts;
      } catch (error) {
        throw handleError(error);
      }
    },

    event: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const event = await Event.findById(id)
          .populate('organizerId', 'name email avatar')
          .lean();

        if (!event || event.isDeleted) {
          throw new Error('Event not found');
        }

        const registrationsCount = await Registration.countDocuments({
          eventId: id,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          isDeleted: false,
        });

        return { ...event, id: event._id.toString(), registrationsCount };
      } catch (error) {
        throw handleError(error);
      }
    },

    myEvents: async (_: any, __: any, context: Context) => {
      try {
        requireAuth(context);
        const events = await Event.find({
          organizerId: context.userId,
          isDeleted: false,
        })
          .populate('organizerId', 'name email avatar')
          .sort({ createdAt: -1 })
          .lean();

        const eventsWithCounts = await Promise.all(
          events.map(async (event) => {
            const count = await Registration.countDocuments({
              eventId: event._id,
              status: { $in: ['PENDING', 'CONFIRMED'] },
              isDeleted: false,
            });
            return { 
              ...event, 
              id: event._id.toString(),
              registrationsCount: count 
            };
          })
        );

        return eventsWithCounts;
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Mutation: {
    createEvent: async (_: any, { input }: { input: any }, context: Context) => {
      try {
        requireAuth(context);
        const validatedInput = createEventInputSchema.parse(input);

        const event = new Event({
          ...validatedInput,
          organizerId: context.userId,
          date: new Date(validatedInput.date),
        });

        await event.save();
        await event.populate('organizerId', 'name email avatar');

        const eventObj = event.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.EVENT_CREATED, {
          eventCreated: { ...eventObj, id: eventObj._id.toString(), registrationsCount: 0 },
        });

        return { ...eventObj, id: eventObj._id.toString(), registrationsCount: 0 };
      } catch (error) {
        throw handleError(error);
      }
    },

    updateEvent: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      try {
        requireAuth(context);
        const validatedInput = updateEventInputSchema.parse(input);

        const event = await Event.findById(id);
        if (!event || event.isDeleted) {
          throw new Error('Event not found');
        }

        // Check if user is organizer or admin
        if (
          event.organizerId.toString() !== context.userId &&
          context.userRole !== 'ADMIN'
        ) {
          throw new Error('Unauthorized');
        }

        if (validatedInput.date) {
          const dateValue = new Date(validatedInput.date as string);
          (event as any).date = dateValue;
          delete (validatedInput as any).date;
        }
        Object.assign(event, validatedInput);
        await event.save();
        await event.populate('organizerId', 'name email avatar');

        const registrationsCount = await Registration.countDocuments({
          eventId: id,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          isDeleted: false,
        });

        const eventObj = event.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.EVENT_UPDATED, {
          eventUpdated: { ...eventObj, id: eventObj._id.toString(), registrationsCount },
        });

        return { ...eventObj, id: eventObj._id.toString(), registrationsCount };
      } catch (error) {
        throw handleError(error);
      }
    },

    deleteEvent: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        requireAuth(context);
        const event = await Event.findById(id);
        if (!event || event.isDeleted) {
          throw new Error('Event not found');
        }

        if (
          event.organizerId.toString() !== context.userId &&
          context.userRole !== 'ADMIN'
        ) {
          throw new Error('Unauthorized');
        }

        event.isDeleted = true;
        await event.save();

        return true;
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Event: {
    id: (parent: any) => {
      return parent._id ? parent._id.toString() : parent.id;
    },
    organizerId: (parent: any) => {
      if (parent.organizerId && typeof parent.organizerId === 'object') {
        return parent.organizerId._id ? parent.organizerId._id.toString() : parent.organizerId.toString();
      }
      return parent.organizerId ? parent.organizerId.toString() : null;
    },
    organizer: async (parent: any) => {
      if (parent.organizerId && typeof parent.organizerId === 'object') {
        return {
          ...parent.organizerId,
          id: parent.organizerId._id ? parent.organizerId._id.toString() : parent.organizerId.id,
        };
      }
      const { User } = await import('../../models/User');
      const user = await User.findById(parent.organizerId).select('-password').lean();
      return user ? { ...user, id: user._id.toString() } : null;
    },
  },
};

