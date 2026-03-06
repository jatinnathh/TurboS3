import React, { useState } from "react";
import "./DoctorCard.css";

// Firestore Doctor type
export interface Doctor {
  id: string;
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  status: string;
  slots: Record<string, boolean>;
  imageUrl: string;
  experienceYears?: number;
  expertise?: string;
  qualification?: string;
}

// Props for single DoctorCard
interface DoctorCardProps {
  doctor: Doctor;
  onSlotClick: (doctorId: string, timeSlot: string) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onSlotClick }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleSlotClick = (slot: string, isAvailable: boolean) => {
    // Prevent action if slot is not available
    if (!isAvailable) {
      return;
    }

    setSelectedSlot(slot);
    onSlotClick(doctor.doctorId, slot);
  };



  // Count available slots
  const availableSlotsCount = Object.values(doctor.slots).filter(Boolean).length;
  const totalSlots = Object.keys(doctor.slots).length;

  // Format experience years
  const experienceText = doctor.experienceYears
    ? `${doctor.experienceYears} ${doctor.experienceYears === 1 ? 'Year' : 'Years'}`
    : 'N/A';

  return (
    <div className="doctor-card">
      <div className="card-header">
        <div className="doctor-photo-container">
          <img
            src={doctor.imageUrl || "/placeholder.jpg"}
            alt={`Photo of Dr. ${doctor.name}`}
            className="doctor-photo"
            onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
          />
        </div>
        <div className="doctor-name-info">
          <h3 className="doctor-name">Dr. {doctor.name}</h3>
          <p className="doctor-qualification">
            {doctor.qualification || doctor.specialization}
          </p>
        </div>
      </div>

      <div className="card-body">
        <div className="detail-item">
          <span className="label">
            <i className="fas fa-building"></i> Department:
          </span>
          <span className="value">{doctor.department}</span>
        </div>

        <div className="detail-item">
          <span className="label">
            <i className="fas fa-stethoscope"></i> Specialty:
          </span>
          <span className="value">{doctor.specialization}</span>
        </div>

        <div className="detail-item">
          <span className="label">
            <i className="fas fa-award"></i> Experience:
          </span>
          <span className="value">{experienceText}</span>
        </div>

        {doctor.expertise && (
          <div className="detail-item detail-no-border">
            <span className="label">
              <i className="fas fa-star"></i> Expertise:
            </span>
            <span className="value">{doctor.expertise}</span>
          </div>
        )}

        {/* Time Slots */}
        <div className="time-slots-section">
          <span className="label slots-label">
            <i className="fas fa-clock"></i> Available Slots Today ({availableSlotsCount}/{totalSlots}):
          </span>

          {totalSlots === 0 ? (
            <p className="no-slots-message">
              <i className="fas fa-info-circle"></i> No slots configured
            </p>
          ) : availableSlotsCount === 0 ? (
            <p className="no-slots-message error">
              <i className="fas fa-exclamation-circle"></i> No available slots today
            </p>
          ) : (
            <div className="slots-container">
              {Object.entries(doctor.slots).map(([slot, isAvailable]) => (
                <button
                  key={slot}
                  disabled={!isAvailable}
                  className={`slot-button ${selectedSlot === slot ? "selected" : ""
                    } ${!isAvailable ? "disabled" : ""}`}
                  onClick={() => handleSlotClick(slot, isAvailable)}
                  title={
                    isAvailable
                      ? `Book appointment at ${slot}`
                      : `Slot ${slot} is already booked`
                  }
                  aria-label={
                    isAvailable
                      ? `Book appointment at ${slot}`
                      : `Slot ${slot} unavailable`
                  }
                  style={!isAvailable ? { pointerEvents: 'none' } : undefined}
                >
                  <i className="fas fa-calendar-check"></i> {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;

// -------------------------------
// Optional: DoctorList component
// -------------------------------
interface DoctorListProps {
  doctors: Doctor[];
  onSlotClick: (doctorId: string, timeSlot: string) => void;
}

export const DoctorList: React.FC<DoctorListProps> = ({ doctors, onSlotClick }) => {
  if (doctors.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-user-md"></i>
        <p>No doctors available at the moment.</p>
        <small>Please check back later or contact support.</small>
      </div>
    );
  }

  return (
    <div className="doctor-list-container">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} onSlotClick={onSlotClick} />
      ))}
    </div>
  );
};