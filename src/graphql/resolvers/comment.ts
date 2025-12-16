import { Comment } from '../../models/Comment';
import { Event } from '../../models/Event';
import { requireAuth, Context } from '../../utils/context';
import { handleError } from '../../utils/errors';
import {
  createCommentInputSchema,
  updateCommentInputSchema,
} from '../../utils/validation';
import { pubsub, SubscriptionEvent } from '../pubsub';

export const commentResolvers = {
  Query: {
    comments: async (_: any, { eventId }: { eventId: string }, context: Context) => {
      try {
        const comments = await Comment.find({
          eventId,
          isDeleted: false,
        })
          .populate('userId', 'name email avatar')
          .populate('eventId', 'title')
          .sort({ createdAt: -1 })
          .lean();

        return comments.map((comment: any) => ({
          ...comment,
          id: comment._id.toString(),
        }));
      } catch (error) {
        throw handleError(error);
      }
    },

    comment: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const comment = await Comment.findById(id)
          .populate('userId', 'name email avatar')
          .populate('eventId', 'title')
          .lean();

        if (!comment || comment.isDeleted) {
          throw new Error('Comment not found');
        }

        return { ...comment, id: comment._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Mutation: {
    createComment: async (_: any, { input }: { input: any }, context: Context) => {
      try {
        requireAuth(context);
        const validatedInput = createCommentInputSchema.parse(input);

        const event = await Event.findById(validatedInput.eventId);
        if (!event || event.isDeleted) {
          throw new Error('Event not found');
        }

        const comment = new Comment({
          userId: context.userId,
          eventId: validatedInput.eventId,
          content: validatedInput.content,
          rating: validatedInput.rating,
        });

        await comment.save();
        await comment.populate('userId', 'name email avatar');
        await comment.populate('eventId', 'title');

        const commentObj = comment.toObject();
        // Publish subscription
        pubsub.publish(SubscriptionEvent.COMMENT_ADDED, {
          commentAdded: { ...commentObj, id: commentObj._id.toString() },
          eventId: validatedInput.eventId,
        });

        return { ...commentObj, id: commentObj._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },

    updateComment: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      try {
        requireAuth(context);
        const validatedInput = updateCommentInputSchema.parse(input);

        const comment = await Comment.findById(id);
        if (!comment || comment.isDeleted) {
          throw new Error('Comment not found');
        }

        if (comment.userId.toString() !== context.userId) {
          throw new Error('Unauthorized');
        }

        Object.assign(comment, validatedInput);
        await comment.save();
        await comment.populate('userId', 'name email avatar');
        await comment.populate('eventId', 'title');

        const commentObj = comment.toObject();
        return { ...commentObj, id: commentObj._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },

    deleteComment: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        requireAuth(context);
        const comment = await Comment.findById(id);
        if (!comment || comment.isDeleted) {
          throw new Error('Comment not found');
        }

        if (
          comment.userId.toString() !== context.userId &&
          context.userRole !== 'ADMIN'
        ) {
          throw new Error('Unauthorized');
        }

        comment.isDeleted = true;
        await comment.save();

        return true;
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Comment: {
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

