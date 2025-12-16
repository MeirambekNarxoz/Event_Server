import { User } from '../../models/User';
import { authResolvers } from '../../graphql/resolvers/auth';
import { generateToken } from '../../utils/auth';

describe('Auth Resolvers', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authResolvers.Mutation.register(null, { input }, {} as any);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(input.email);
      expect(result.user.name).toBe(input.name);
    });

    it('should fail if email already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const input = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };

      await expect(
        authResolvers.Mutation.register(null, { input }, {} as any)
      ).rejects.toThrow('User with this email already exists');
    });

    it('should validate input fields', async () => {
      const input = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid email
        password: '123', // Too short
      };

      await expect(
        authResolvers.Mutation.register(null, { input }, {} as any)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should login with correct credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authResolvers.Mutation.login(null, { input }, {} as any);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(input.email);
    });

    it('should fail with incorrect password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(
        authResolvers.Mutation.login(null, { input }, {} as any)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail with non-existent email', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(
        authResolvers.Mutation.login(null, { input }, {} as any)
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('me', () => {
    it('should return current user when authenticated', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      const result = await authResolvers.Query.me(null, {}, context as any);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error when not authenticated', async () => {
      const context = {
        isAuthenticated: false,
      };

      await expect(
        authResolvers.Query.me(null, {}, context as any)
      ).rejects.toThrow('Authentication required');
    });
  });
});

