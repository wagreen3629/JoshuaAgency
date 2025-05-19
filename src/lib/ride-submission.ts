import { parsePhoneNumber, format as formatPhoneNumber } from 'libphonenumber-js';
import { addDays, format } from 'date-fns';
import { zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';

// Track submissions to prevent duplicates
const submissionTracker = new Map<string, boolean>();

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Ride Submission] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Ride Submission Error] ${message}`, error ? error : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Ride Submission Debug] ${message}`, data ? data : '');
    }
  }
};

interface RideLocation {
  latitude: number;
  longitude: number;
}

interface Guest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface RideSubmissionData {
  clientId: string;
  contactPhone: string;
  guest: Guest;
  fareId: string;
  dropoff: RideLocation;
  pickup: RideLocation;
  productId: string;
  driverNote: string;
  stops: RideLocation[];
  rideType: 'immediate' | 'scheduled' | 'flexible' | 'hourly';
  scheduledDate?: {
    date: Date;
    time: string;
    timezone: string;
  };
}

interface RideSubmissionResponse {
  status: 'success' | 'failure';
  message?: string;
  webhookStatus?: string;
  webhookMessage?: string;
}

export async function submitRideRequest(data: RideSubmissionData): Promise<RideSubmissionResponse> {
  try {
    log.info('Starting ride submission process');
    
    // Generate unique key for this submission
    const submissionKey = `${data.clientId}-${data.fareId}-${data.scheduledDate?.date ? new Date(data.scheduledDate.date).getTime() : 'immediate'}`;
    
    // Check if already submitting
    if (submissionTracker.get(submissionKey)) {
      log.info('Duplicate submission prevented', { submissionKey });
      return {
        status: 'failure',
        message: 'A submission is already in progress for this ride',
        webhookStatus: 'Error',
        webhookMessage: 'Duplicate submission'
      };
    }
    
    // Mark as submitting
    submissionTracker.set(submissionKey, true);
    
    log.info('Received ride data', data);

    // Format phone number to E.164
    const phoneNumber = parsePhoneNumber(data.guest.phone_number, 'US');
    if (!phoneNumber?.isValid()) {
      log.error('Invalid phone number format', data.guest.phone_number);
      throw new Error('Invalid phone number format');
    }

    log.info('Phone number validated successfully');

    // Prepare the request payload
    const payload = {
      client_id: data.clientId,
      ride_type: data.rideType,
      guest: {
        ...data.guest,
        phone_number: phoneNumber.format('E.164')
      },
      note_for_driver: data.driverNote,
      fare_id: data.fareId,
      dropoff: data.dropoff,
      pickup: data.pickup,
      product_id: data.productId,
      stops: data.stops,
     scheduling: {
      pickup_time: data.rideType === 'immediate' ? '' : (() => {
        if (!data.scheduledDate) return '';
    
        const { date, time, timezone } = data.scheduledDate;
    
        if (!date || !time || !timezone) {
          throw new Error('Missing required scheduling information');
        }
    
        log.info('Scheduling check values1', { date, time, timezone });
    
        // Construct ISO 8601 datetime string from date and time
        const dateTimeStr = `${date}T${time}:00`;
    
        // ✅ Correct conversion from the local timezone to UTC
        const utcDate = zonedTimeToUtc(dateTimeStr, timezone); // e.g., America/Chicago
        const utcTimestamp = utcDate.getTime(); // Correct UTC timestamp in ms
    
        log.info('Timezone conversion result', {
          originalDateTime: dateTimeStr,
          timezone,
          utcDate: utcDate.toISOString(),
          utcTimestamp,
        });

        log.info('⏱ FULL TIMESTAMP DEBUG', {
          date,
          time,
          constructedDateTimeStr: dateTimeStr,
          utcDate: utcDate.toISOString(),
          utcTimestamp,
          backConvertedDate: new Date(utcTimestamp).toISOString()
        });
    
        return utcTimestamp.toString();
      })(),
    
      deferred_ride_options: {
        pickup_day:
          data.rideType === 'flexible' && data.scheduledDate?.date
            ? format(new Date(data.scheduledDate.date), 'yyyy-MM-dd')
            : ''
      }
    },
      contacts_to_notify: [
        {
        contactPhone: data.contactPhone
        }
      ]
    };

    log.info('Prepared webhook payload', payload);
    log.info('Submitting request to webhook');

    // Make the request to the webhook
    const response = await fetch('https://hook.us1.make.com/oclswdy3fakyf8btka6qrsln8vc68g0d', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      log.info('Webhook request failed', {
        status: response.status,
        statusText: response.statusText,
        status: response.status
      });
      
      // Handle specific HTTP status codes
      if (response.status === 400) {
        return {
          status: 'failure',
          message: 'The ride request contains invalid information. Please check all fields and try again.',
          code: 'INVALID_REQUEST',
          details: 'One or more required fields are missing or invalid'
        };
      }
      
      if (response.status === 401 || response.status === 403) {
        return {
          status: 'failure',
          message: 'You are not authorized to schedule rides at this time. Please log in again or contact support.',
          code: 'UNAUTHORIZED',
          details: 'Authentication or authorization error'
        };
      }
      
      if (response.status === 429) {
        return {
          status: 'failure',
          message: 'Too many ride requests. Please wait a few minutes and try again.',
          code: 'RATE_LIMIT',
          details: 'Rate limit exceeded'
        };
      }
      
      if (response.status >= 500) {
        return {
          status: 'failure',
          message: 'The ride scheduling service is temporarily unavailable. Please try again in a few minutes.',
          code: 'SERVER_ERROR',
          details: 'Internal server error'
        };
      }
      
      return {
        status: 'failure',
        message: 'Unable to schedule ride at this time. Please try again later.',
        code: 'UNKNOWN_ERROR',
        details: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    log.info('Received webhook response');
    const result = await response.json();
    log.info('Parsed webhook response', result);
    
    // Clear submission tracking
    submissionTracker.delete(submissionKey);

    // Return response with webhook status and message
    return {
      status: result.status === 'Success' ? 'success' : 'Failure',
      message: result.message || (result.status === 'Success' ? 'Ride scheduled successfully' : 'Failed to schedule ride'),
      webhookStatus: result.status,
      webhookMessage: result.message    
    };
  } catch (error) {
    log.error('Unexpected error during ride submission', error);
    
    // Clear submission tracking on error
    const submissionKey = `${data.clientId}-${data.fareId}-${data.scheduledDate?.date ? new Date(data.scheduledDate.date).getTime() : 'immediate'}`;
    submissionTracker.delete(submissionKey);
    
    return {
      status: 'failure',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      webhookStatus: 'Error',
      webhookMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}