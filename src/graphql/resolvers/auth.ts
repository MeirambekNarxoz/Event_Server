import { IUser } from '../../models/User';
import { User } from '../../models/User';
import { generateToken } from '../../utils/auth';
import { requireAuth, Context } from '../../utils/context';
import { handleError, AppError, ErrorCode } from '../../utils/errors';
import { registerInputSchema, loginInputSchema } from '../../utils/validation';

export const authResolvers = {
  User: {
    id: (parent: any) => {
      return parent._id ? parent._id.toString() : parent.id;
    },
  },
  Query: {
    me: async (_: any, __: any, context: Context) => {
      try {
        requireAuth(context);
        const user = await User.findById(context.userId).select('-password').lean();
        if (!user || user.isDeleted) {
          throw new AppError('User not found', ErrorCode.NOT_FOUND, 404);
        }
        return { ...user, id: user._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },
    users: async (_: any, __: any, context: Context) => {
      try {
        requireAuth(context);
        const users = await User.find({ isDeleted: false }).select('-password').lean();
        return users.map((user: any) => ({ ...user, id: user._id.toString() }));
      } catch (error) {
        throw handleError(error);
      }
    },
    user: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        requireAuth(context);
        const user = await User.findById(id).select('-password').lean();
        if (!user || user.isDeleted) {
          throw new AppError('User not found', ErrorCode.NOT_FOUND, 404);
        }
        return { ...user, id: user._id.toString() };
      } catch (error) {
        throw handleError(error);
      }
    },
  },

  Mutation: {
    register: async (_: any, { input }: { input: any }) => {
      try {
        const validatedInput = registerInputSchema.parse(input);
        
        const existingUser = await User.findOne({ email: validatedInput.email });
        if (existingUser) {
          throw new AppError('User with this email already exists', ErrorCode.BAD_REQUEST, 400);
        }

        const user = new User(validatedInput);
        await user.save();

        const token = generateToken(user);
        const userObj = await User.findById(user._id).select('-password').lean();
        return {
          token,
          user: userObj ? { ...userObj, id: userObj._id.toString() } : null,
        };
      } catch (error) {
        throw handleError(error);
      }
    },

    login: async (_: any, { input }: { input: any }) => {
      try {
        const validatedInput = loginInputSchema.parse(input);
        
        const user = await User.findOne({ email: validatedInput.email }).select('+password');
        if (!user || user.isDeleted) {
          throw new AppError('Invalid email or password', ErrorCode.UNAUTHENTICATED, 401);
        }

        const isPasswordValid = await user.comparePassword(validatedInput.password);
        if (!isPasswordValid) {
          throw new AppError('Invalid email or password', ErrorCode.UNAUTHENTICATED, 401);
        }

        const token = generateToken(user);
        const userObj = await User.findById(user._id).select('-password').lean();
        return {
          token,
          user: userObj ? { ...userObj, id: userObj._id.toString() } : null,
        };
      } catch (error) {
        throw handleError(error);
      }
    },
  },
};

