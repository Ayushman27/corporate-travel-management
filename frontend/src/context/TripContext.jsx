import { createContext, useContext, useState, useCallback } from 'react';
import { tripAPI } from '../services/api';
import toast from 'react-hot-toast';

const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
  const [myTrips,  setMyTrips]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentPlans, setCurrentPlans] = useState([]);

  const fetchMyTrips = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await tripAPI.myTrips();
      setMyTrips(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitTrip = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await tripAPI.request(formData);
      toast.success('Trip request submitted! Plans generated.');
      setCurrentTrip(data.data.trip);
      setCurrentPlans(data.data.plans || []);
      await fetchMyTrips();
      return data.data;
    } finally {
      setLoading(false);
    }
  }, [fetchMyTrips]);

  const loadTripDetail = useCallback(async (tripId) => {
    setLoading(true);
    try {
      const { data } = await tripAPI.getById(tripId);
      setCurrentTrip(data.data.trip);
      setCurrentPlans(data.data.plans || []);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const bookSelectedPlan = useCallback(async (tripId, planId) => {
    setLoading(true);
    try {
      const { data } = await tripAPI.book(tripId, planId);
      toast.success('🎫 Booking confirmed!');
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TripContext.Provider value={{
      myTrips, loading, currentTrip, currentPlans,
      fetchMyTrips, submitTrip, loadTripDetail, bookSelectedPlan,
      setCurrentTrip, setCurrentPlans
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
};
