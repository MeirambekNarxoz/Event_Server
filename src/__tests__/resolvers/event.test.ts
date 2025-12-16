import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { eventResolvers } from '../../graphql/resolvers/event';

describe('Event Resolvers', () => {
  let organizer: any;
  let user: any;

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
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const input = {
        title: 'Test Event',
        description: 'This is a test event description',
        date: new Date('2024-12-31T10:00:00Z').toISOString(),
        location: 'Test Location',
        capacity: 100,
        category: 'CONFERENCE',
      };

      const context = {
        userId: organizer._id.toString(),
        isAuthenticated: true,
      };

      const result = await eventResolvers.Mutation.createEvent(
        null,
        { input },
        context as any
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.organizerId.toString()).toBe(organizer._id.toString());
    });

    it('should require authentication', async () => {
      const input = {
        title: 'Test Event',
        description: 'This is a test event description',
        date: new Date('2024-12-31T10:00:00Z').toISOString(),
        location: 'Test Location',
        capacity: 100,
        category: 'CONFERENCE',
      };

      const context = {
        isAuthenticated: false,
      };

      await expect(
        eventResolvers.Mutation.createEvent(null, { input }, context as any)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateEvent', () => {
    it('should update event when user is organizer', async () => {
      const event = await Event.create({
        title: 'Original Title',
        description: 'Original description',
        date: new Date('2024-12-31T10:00:00Z'),
        location: 'Original Location',
        capacity: 100,
        organizerId: organizer._id,
        category: 'CONFERENCE',
      });

      const input = {
        title: 'Updated Title',
      };

      const context = {
        userId: organizer._id.toString(),
        isAuthenticated: true,
      };

      const result = await eventResolvers.Mutation.updateEvent(
        null,
        { id: event._id.toString(), input },
        context as any
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should not allow update by non-organizer', async () => {
      const event = await Event.create({
        title: 'Original Title',
        description: 'Original description',
        date: new Date('2024-12-31T10:00:00Z'),
        location: 'Original Location',
        capacity: 100,
        organizerId: organizer._id,
        category: 'CONFERENCE',
      });

      const input = {
        title: 'Updated Title',
      };

      const context = {
        userId: user._id.toString(),
        isAuthenticated: true,
      };

      await expect(
        eventResolvers.Mutation.updateEvent(
          null,
          { id: event._id.toString(), input },
          context as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('events query', () => {
    beforeEach(async () => {
      await Event.create([
        {
          title: 'Event 1',
          description: 'Description 1',
          date: new Date('2024-06-01T10:00:00Z'),
          location: 'Location 1',
          capacity: 100,
          organizerId: organizer._id,
          status: 'PUBLISHED',
          category: 'CONFERENCE',
        },
        {
          title: 'Event 2',
          description: 'Description 2',
          date: new Date('2024-07-01T10:00:00Z'),
          location: 'Location 2',
          capacity: 200,
          organizerId: organizer._id,
          status: 'PUBLISHED',
          category: 'WORKSHOP',
        },
      ]);
    });

    it('should return all events', async () => {
      const result = await eventResolvers.Query.events(null, {}, {} as any);
      expect(result.length).toBe(2);
    });

    it('should filter by status', async () => {
      const result = await eventResolvers.Query.events(
        null,
        { status: 'PUBLISHED' },
        {} as any
      );
      expect(result.length).toBe(2);
    });

    it('should filter by category', async () => {
      const result = await eventResolvers.Query.events(
        null,
        { category: 'CONFERENCE' },
        {} as any
      );
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('CONFERENCE');
    });
  });
});

