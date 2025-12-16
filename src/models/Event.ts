import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  organizerId: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  category: string;
  imageUrl?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [3, 'Location must be at least 3 characters'],
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [10000, 'Capacity cannot exceed 10000'],
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'CONFERENCE',
        'WORKSHOP',
        'SEMINAR',
        'NETWORKING',
        'CONCERT',
        'SPORTS',
        'OTHER',
      ],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EventSchema.index({ organizerId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ isDeleted: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);

