Here's the closing bracket that was missing from the code:

```javascript
                          {addresses.find(addr => addr.id === stopId)?.address || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Ride Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ride Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Ride Type:</span>
                    <p className="text-sm font-medium text-gray-900 capitalize">{rideType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Date:</span>
                    <p className="text-sm font-medium text-gray-900">{rideDate}</p>
                  </div>
                  {rideType !== 'flexible' && (
                    <div>
                      <span className="text-sm text-gray-500">Time:</span>
                      <p className="text-sm font-medium text-gray-900">{rideTime}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500">Timezone:</span>
                    <p className="text-sm font-medium text-gray-900">{rideTimezone}</p>
                  </div>
                </div>
                {driverNote && (
                  <div>
                    <span className="text-sm text-gray-500">Note to Driver:</span>
                    <p className="text-sm font-medium text-gray-900">{driverNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isSubmitting}
            >
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : currentStep === 5 ? 'Submit Ride' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleRideWizard;
```