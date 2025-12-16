import { Registration } from '../../models/Registration';
import { Event } from '../../models/Event';
import { requireAuth, Context } from '../../utils/context';
import { handleError, AppError, ErrorCode } from '../../utils/errors';
import {
  createRegistrationInputSchema,
  updateRegistrationInputSchema,
} from '../../utils/validation';
import { pubsub, SubscriptionEvent } from '../pubsub';

export const registrationResolvers = {
  Query: {
    registrations: async (
      _: any,
      { eventId, userId }: { eventId?: string; userId?: string },
      context: Context
    ) => {
      try {
        requireAuth(context);
        const query: any = { isDeleted: false };
        if (eventId) query.eventId = eventId;
        if (userId) query.userId = userId;

        const registrations = await Registration.find(query)
          .populate('userId', 'name email avatar')
          .populate('eventId', 'title date location')
          .sort({ createdAt: -1 })
          .lean();

        return registrations.map((reg: any) => ({
          ...reg,
          id: reg._id.toString(),
        }));
      } catch (error) {
        throw handleError(error);
      }
    },

    registration: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        requireAuth(context);
        const registration = await Registration.findById(id)
          .populate('userId', 'name email avatar')
          .populate('eventId', 'title date location')
          .lean();

        if (!registration || registration.isDeleted) {
          throw new Error('Registration not found');
        }

        return { ...registration, id: registration._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },

    myRegistrations: async (_: any, __: any, context: Context) => {
      try {
        requireAuth(context);
        const registrations = await Registration.find({
          userId: context.userId,
          isDeleted: false,
        })
          .populate('userId', 'name email avatar')
          .populate('eventId', 'title date location')
          .sort({ createdAt: -1 })
          .lean();

        return registrations.map((reg: any) => ({
          ...reg,
          id: reg._id.toString(),
        }));
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Mutation: {
    createRegistration: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      try {
        requireAuth(context);
        const validatedInput = createRegistrationInputSchema.parse(input);

        const event = await Event.findById(validatedInput.eventId);
        if (!event || event.isDeleted) {
          throw new AppError('Event not found', ErrorCode.NOT_FOUND, 404);
        }

        if (event.status !== 'PUBLISHED') {
          throw new AppError('Event is not available for registration', ErrorCode.BAD_REQUEST, 400);
        }

        // Check if already registered
        const existing = await Registration.findOne({
          userId: context.userId,
          eventId: validatedInput.eventId,
          isDeleted: false,
        });

        if (existing) {
          throw new AppError('Already registered for this event', ErrorCode.BAD_REQUEST, 400);
        }

        // Check capacity
        const currentRegistrations = await Registration.countDocuments({
          eventId: validatedInput.eventId,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          isDeleted: false,
        });

        if (currentRegistrations >= event.capacity) {
          throw new AppError('Event is full', ErrorCode.BAD_REQUEST, 400);
        }

        const registration = new Registration({
          userId: context.userId,
          eventId: validatedInput.eventId,
          notes: validatedInput.notes,
          status: 'PENDING',
        });

        await registration.save();
        await registration.populate('userId', 'name email avatar');
        await registration.populate('eventId', 'title date location');

        const regObj = registration.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.REGISTRATION_CREATED, {
          registrationCreated: { ...regObj, id: regObj._id.toString() },
          eventId: validatedInput.eventId,
        });

        return { ...regObj, id: regObj._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },

    updateRegistration: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      try {
        requireAuth(context);
        const validatedInput = updateRegistrationInputSchema.parse(input);

        const registration = await Registration.findById(id);
        if (!registration || registration.isDeleted) {
          throw new AppError('Registration not found', ErrorCode.NOT_FOUND, 404);
        }

        // Check permissions
        const isOwner = registration.userId.toString() === context.userId;
        const isEventOrganizer = await Event.findById(registration.eventId).then(
          (e) => e?.organizerId.toString() === context.userId
        );
        const isAdmin = context.userRole === 'ADMIN';

        if (!isOwner && !isEventOrganizer && !isAdmin) {
          throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 403);
        }

        Object.assign(registration, validatedInput);
        await registration.save();
        await registration.populate('userId', 'name email avatar');
        await registration.populate('eventId', 'title date location');

        const regObj = registration.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.REGISTRATION_UPDATED, {
          registrationUpdated: { ...regObj, id: regObj._id.toString() },
          eventId: registration.eventId.toString(),
        });

        return { ...regObj, id: regObj._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },

    cancelRegistration: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        requireAuth(context);
        const registration = await Registration.findById(id);
        if (!registration || registration.isDeleted) {
          throw new AppError('Registration not found', ErrorCode.NOT_FOUND, 404);
        }

        if (registration.userId.toString() !== context.userId) {
          throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 403);
        }

        registration.status = 'CANCELLED';
        await registration.save();
        await registration.populate('userId', 'name email avatar');
        await registration.populate('eventId', 'title date location');

        const regObj = registration.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.REGISTRATION_UPDATED, {
          registrationUpdated: { ...regObj, id: regObj._id.toString() },
          eventId: registration.eventId.toString(),
        });

        return { ...regObj, id: regObj._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Registration: {
    id: (parent: any) => {
      return parent._id ? parent._id.toString() : parent.id;
    },
    userId: (parent: any) => {
      if (parent.userId && typeof parent.userId === 'object') {
        return parent.userId._id ? parent.userId._id.toString() : parent.userId.toString();
      }
      return parent.userId ? parent.userId.toString() : null;
    },
    eventId: (parent: any) => {
      if (parent.eventId && typeof parent.eventId === 'object') {
        return parent.eventId._id ? parent.eventId._id.toString() : parent.eventId.toString();
      }
      return parent.eventId ? parent.eventId.toString() : null;
    },
    user: async (parent: any) => {
      if (parent.userId && typeof parent.userId === 'object') {
        return {
          ...parent.userId,
          id: parent.userId._id ? parent.userId._id.toString() : parent.userId.id,
        };
      }
      const { User } = await import('../../models/User');
      const user = await User.findById(parent.userId).select('-password').lean();
      return user ? { ...user, id: user._id.toString() } : null;
    },
    event: async (parent: any) => {
      if (parent.eventId && typeof parent.eventId === 'object') {
        return {
          ...parent.eventId,
          id: parent.eventId._id ? parent.eventId._id.toString() : parent.eventId.id,
        };
      }
      const event = await Event.findById(parent.eventId).lean();
      return event ? { ...event, id: event._id.toString() } : null;
    },
  },
};

