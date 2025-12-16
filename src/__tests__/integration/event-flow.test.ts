import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { Comment } from '../../models/Comment';
import { eventResolvers } from '../../graphql/resolvers/event';
import { registrationResolvers } from '../../graphql/resolvers/registration';
import { commentResolvers } from '../../graphql/resolvers/comment';

describe('Event Flow Integration Test', () => {
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

  it('should complete full event lifecycle', async () => {
    const organizerContext = {
      userId: organizer._id.toString(),
      isAuthenticated: true,
    };

    const userContext = {
      userId: user._id.toString(),
      isAuthenticated: true,
    };

    // 1. Create event
    const createEventInput = {
      title: 'Integration Test Event',
      description: 'This is an integration test event',
      date: new Date('2024-12-31T10:00:00Z').toISOString(),
      location: 'Test Location',
      capacity: 50,
      category: 'CONFERENCE',
    };

    const event = await eventResolvers.Mutation.createEvent(
      null,
      { input: createEventInput },
      organizerContext as any
    );

    expect(event).toBeDefined();
    expect(event.title).toBe(createEventInput.title);

    // 2. Publish event
    const updateEventInput = {
      status: 'PUBLISHED',
    };

    const publishedEvent = await eventResolvers.Mutation.updateEvent(
      null,
      { id: event.id, input: updateEventInput },
      organizerContext as any
    );

    expect(publishedEvent.status).toBe('PUBLISHED');

    // 3. User registers for event
    const registrationInput = {
      eventId: event.id,
      notes: 'Looking forward to it!',
    };

    const registration = await registrationResolvers.Mutation.createRegistration(
      null,
      { input: registrationInput },
      userContext as any
    );

    expect(registration).toBeDefined();
    expect(registration.status).toBe('PENDING');

    // 4. Confirm registration
    const updateRegistrationInput = {
      status: 'CONFIRMED',
    };

    const confirmedRegistration = await registrationResolvers.Mutation.updateRegistration(
      null,
      { id: registration.id, input: updateRegistrationInput },
      organizerContext as any
    );

    expect(confirmedRegistration.status).toBe('CONFIRMED');

    // 5. User adds comment
    const commentInput = {
      eventId: event.id,
      content: 'Great event!',
      rating: 5,
    };

    const comment = await commentResolvers.Mutation.createComment(
      null,
      { input: commentInput },
      userContext as any
    );

    expect(comment).toBeDefined();
    expect(comment.content).toBe(commentInput.content);
    expect(comment.rating).toBe(commentInput.rating);

    // 6. Verify all data exists
    const events = await eventResolvers.Query.events(null, {}, {} as any);
    expect(events.length).toBeGreaterThan(0);

    const registrations = await registrationResolvers.Query.registrations(
      null,
      { eventId: event.id },
      userContext as any
    );
    expect(registrations.length).toBe(1);

    const comments = await commentResolvers.Query.comments(
      null,
      { eventId: event.id },
      {} as any
    );
    expect(comments.length).toBe(1);
  });
});

