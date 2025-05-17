// Ride tracking interfaces and types
export interface RideData {
  // Client Information
  client: {
    id: string | null;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    language: string;
  };
  // Locations
  locations: {
    pickup: {
      id: string;
      address: string;
      latitude: number;
      longitude: number;
      instructions?: string;
    };
    dropoff: {
      id: string;
      address: string;
      latitude: number;
      longitude: number;
      instructions?: string;
    };
    stops?: Array<{
      id: string;
      address: string;
      latitude: number;
      longitude: number;
      instructions?: string;
    }>;
  };
  // Zone Information
  zone: {
    id: string;
    label: string;
    instruction: string;
    latitude: string;
    longitude: string;
    note: string;
    token?: string;
  } | null;
  // Product Selection
  product: {
    id: string;
    name: string;
    capacity: number;
    estimate: {
      fare: string;
      fare_id: string;
      distance: number;
      duration: number;
      unit: string;
    };
  } | null;
  // Timestamps
  timestamps: {
    created: string;
    updated: string;
    lastValidated: string;
  };
  // Validation Status
  validation: {
    client: boolean;
    locations: boolean;
    zone: boolean;
    product: boolean;
    overall: boolean;
  };
}

// Validation functions
export function validateClientInfo(data: RideData['client']): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Starting client validation`);
  console.log(`[${timestamp}] 📋 Client data:`, {
    firstName: data.firstName || '(empty)',
    lastName: data.lastName || '(empty)',
    phone: data.phone || '(empty)',
    email: data.email || '(empty)',
    language: data.language || '(empty)'
  });

  const isValid = !!(
    data.firstName?.trim() &&
    data.lastName?.trim() &&
    data.phone?.trim() &&
    data.language?.trim()
  );

  console.log(`[${timestamp}] ✅ Client validation complete:`, {
    isValid,
    validations: {
      firstName: !!data.firstName?.trim(),
      lastName: !!data.lastName?.trim(),
      phone: !!data.phone?.trim(),
      language: !!data.language?.trim()
    }
  });

  return isValid;
}

export function validateLocations(data: RideData['locations']): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Starting location validation`);
  console.log(`[${timestamp}] 📍 Location data:`, {
    pickup: {
      address: data.pickup?.address || '(empty)',
      coordinates: data.pickup ? `${data.pickup.latitude},${data.pickup.longitude}` : '(empty)'
    },
    dropoff: {
      address: data.dropoff?.address || '(empty)',
      coordinates: data.dropoff ? `${data.dropoff.latitude},${data.dropoff.longitude}` : '(empty)'
    },
    stopCount: data.stops?.length || 0,
    stops: data.stops?.length ? `${data.stops.length} stops` : 'no stops'
  });

  const isValid = !!(
    data.pickup?.id &&
    data.pickup?.address &&
    data.pickup?.latitude &&
    data.pickup?.longitude &&
    data.dropoff?.id &&
    data.dropoff?.address &&
    data.dropoff?.latitude &&
    data.dropoff?.longitude
  );

  console.log(`[${timestamp}] ✅ Location validation complete:`, {
    isValid,
    pickup: {
      hasId: !!data.pickup?.id,
      hasAddress: !!data.pickup?.address,
      hasCoordinates: !!(data.pickup?.latitude && data.pickup?.longitude)
    },
    dropoff: {
      hasId: !!data.dropoff?.id,
      hasAddress: !!data.dropoff?.address,
      hasCoordinates: !!(data.dropoff?.latitude && data.dropoff?.longitude)
    }
  });

  return isValid;
}

export function validateZone(data: RideData['zone']): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Starting zone validation`);
  console.log(`[${timestamp}] 🗺️ Zone data:`, data ? {
    id: data.id,
    label: data.label,
    coordinates: `${data.latitude},${data.longitude}`,
    hasToken: !!data.token
  } : '(no zone data)');

  const isValid = !!(
    data?.id &&
    data?.label &&
    data?.latitude &&
    data?.longitude
  );

  console.log(`[${timestamp}] ✅ Zone validation complete:`, {
    isValid,
    hasId: !!data?.id,
    hasLabel: !!data?.label,
    hasCoordinates: !!(data?.latitude && data?.longitude)
  });

  return isValid;
}

export function validateProduct(data: RideData['product']): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Starting product validation`);
  console.log(`[${timestamp}] 🚗 Product data:`, data ? {
    id: data.id,
    name: data.name,
    capacity: data.capacity,
    estimate: data.estimate ? {
      fare: data.estimate.fare,
      fare_id: data.estimate.fare_id,
      distance: data.estimate.distance,
      duration: data.estimate.duration,
      unit: data.estimate.unit
    } : '(no estimate)'
  } : '(no product data)');

  const isValid = !!(
    data?.id &&
    data?.name &&
    data?.estimate?.fare &&
    data?.estimate?.fare_id &&
    data?.estimate?.distance &&
    data?.estimate?.duration
  );

  console.log(`[${timestamp}] ✅ Product validation complete:`, {
    isValid,
    hasId: !!data?.id,
    hasName: !!data?.name,
    hasEstimate: !!(
      data?.estimate?.fare &&
      data?.estimate?.fare_id &&
      data?.estimate?.distance &&
      data?.estimate?.duration
    )
  });

  return isValid;
}

// Create initial ride data structure
export function createInitialRideData(): RideData {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🆕 Creating initial ride data structure`);

  return {
    client: {
      id: null,
      firstName: '',
      lastName: '',
      phone: '',
      email: null,
      language: 'English'
    },
    locations: {
      pickup: {
        id: '',
        address: '',
        latitude: 0,
        longitude: 0
      },
      dropoff: {
        id: '',
        address: '',
        latitude: 0,
        longitude: 0
      }
    },
    zone: null,
    product: null,
    timestamps: {
      created: timestamp,
      updated: timestamp,
      lastValidated: timestamp
    },
    validation: {
      client: false,
      locations: false,
      zone: false,
      product: false,
      overall: false
    }
  };
}

// Update ride data
export function updateRideData(
  currentData: RideData,
  updates: Partial<RideData>,
  section: keyof RideData['validation']
): RideData {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Updating ride data:`, {
    section,
    updates
  });

  const newData = {
    ...currentData,
    ...updates,
    timestamps: {
      ...currentData.timestamps,
      updated: timestamp
    }
  };

  // Validate the updated section
  let isValid = false;
  switch (section) {
    case 'client':
      isValid = validateClientInfo(newData.client);
      break;
    case 'locations':
      isValid = validateLocations(newData.locations);
      break;
    case 'zone':
      isValid = validateZone(newData.zone);
      break;
    case 'product':
      isValid = validateProduct(newData.product);
      break;
  }

  // Update validation status
  newData.validation = {
    ...newData.validation,
    [section]: isValid,
    overall: false // Will be updated below
  };

  // Check overall validation status
  newData.validation.overall = (
    newData.validation.client &&
    newData.validation.locations &&
    newData.validation.zone &&
    newData.validation.product
  );

  newData.timestamps.lastValidated = timestamp;

  console.log(`[${timestamp}] ✨ Update complete:`, {
    validation: newData.validation,
    isComplete: newData.validation.overall
  });

  return newData;
}

// Prepare webhook payload
export function prepareWebhookPayload(data: RideData): Record<string, any> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📦 Preparing webhook payload`);

  if (!data.validation.overall) {
    console.error(`[${timestamp}] ❌ Cannot prepare webhook payload - incomplete data:`, {
      validation: data.validation
    });
    throw new Error('Cannot prepare webhook payload - data validation incomplete');
  }

  // Get the token from UberTokens table
  const token = data.zone?.token || '';

  // Convert pickup coordinates to strings as required
  const pickupLat = String(data.locations.pickup.latitude);
  const pickupLong = String(data.locations.pickup.longitude);

  // Keep dropoff coordinates as numbers
  const dropoffLat = data.locations.dropoff.latitude;
  const dropoffLong = data.locations.dropoff.longitude;

  // Prepare waypoints array from selected stops
  const waypoints = (data.locations.stops || []).map(stop => ({
    latitude: parseFloat(String(stop.latitude)),
    longitude: parseFloat(String(stop.longitude))
  }));

  const payload = {
    token: token,
    pickupLat: pickupLat,
    pickupLong: pickupLong,
    dropoffLat: dropoffLat,
    dropoffLong: dropoffLong,
    fare_id: data.product?.estimate?.fare_id || '',
    waypoints: waypoints
  };

  if (!data.product?.estimate?.fare_id) {
    throw new Error('Product estimate or fare ID is missing. Please select a valid product.');
  }

  console.log(`[${timestamp}] Webhook payload prepared:`, payload);
  return payload;
}