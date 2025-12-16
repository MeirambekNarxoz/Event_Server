import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { registrationResolvers } from '../../graphql/resolvers/registration';

describe('Registration Resolvers', () => {
  let organizer: any;
  let user: any;
  let event: any;

  beforeEach(async () => {
    organizer = await User.create({
      name: 'Organizer',
      email: 'organizer@example.com',
      password: 'password123',
      role: 'ORGANIZER',
    });

    user = await User.create({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      role: 'USER',
    });

    event = await Event.create({
      title: 'Test Event',
      description: 'Test description',
      date: new Date('2024-12-31T10:00:00Z'),
      location: 'Test Location',
      capacity: 100,
      organizerId: organizer._id,
      status: 'PUBLISHED',
      category: 'CONFERENCE',
    });
  });

  describe('createRegistration', () => {
    it('should create registration successfully', async () => {
      const input = {
        eventId: event._id.toString(),
      };

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      const result = await registrationResolvers.Mutation.createRegistration(
        null,
        { input },
        context as any
      );

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(user._id.toString());
      expect(result.eventId.toString()).toBe(event._id.toString());
      expect(result.status).toBe('PENDING');
    });

    it('should prevent duplicate registrations', async () => {
      await Registration.create({
        userId: user._id,
        eventId: event._id,
        status: 'CONFIRMED',
      });

      const input = {
        eventId: event._id.toString(),
      };

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      await expect(
        registrationResolvers.Mutation.createRegistration(
          null,
          { input },
          context as any
        )
      ).rejects.toThrow('Already registered');
    });

    it('should check event capacity', async () => {
      const smallEvent = await Event.create({
        title: 'Small Event',
        description: 'Test',
        date: new Date('2024-12-31T10:00:00Z'),
        location: 'Test',
        capacity: 1,
        organizerId: organizer._id,
        status: 'PUBLISHED',
        category: 'CONFERENCE',
      });

      await Registration.create({
        userId: organizer._id,
        eventId: smallEvent._id,
        status: 'CONFIRMED',
      });

      const input = {
        eventId: smallEvent._id.toString(),
      };

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      await expect(
        registrationResolvers.Mutation.createRegistration(
          null,
          { input },
          context as any
        )
      ).rejects.toThrow('Event is full');
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel registration', async () => {
      const registration = await Registration.create({
        userId: user._id,
        eventId: event._id,
        status: 'CONFIRMED',
      });

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      const result = await registrationResolvers.Mutation.cancelRegistration(
        null,
        { id: registration._id.toString() },
        context as any
      );

      expect(result.status).toBe('CANCELLED');
    });

    it('should not allow canceling other users registrations', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const registration = await Registration.create({
        userId: otherUser._id,
        eventId: event._id,
        status: 'CONFIRMED',
      });

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      await expect(
        registrationResolvers.Mutation.cancelRegistration(
          null,
          { id: registration._id.toString() },
          context as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });
});

