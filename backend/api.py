from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/doctors_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-here'

db = SQLAlchemy(app)

# Doctor model
class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    image = db.Column(db.String(200))
    gender = db.Column(db.Enum('Male', 'Female'))
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))  # New phone field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'specialty': self.specialty,
            'city': self.city,
            'image': self.image or '',
            'gender': self.gender,
            'address': self.address or '',
            'phone': self.phone or ''  # Include phone
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_doctor = db.Column(db.Boolean, default=False)  # New field
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)  # New field

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'is_doctor': self.is_doctor,  # Include in response
            'doctor_id': self.doctor_id   # Include in response
        }

# Appointment model
class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('Pending', 'Confirmed', 'Completed', 'Cancelled'), default='Pending')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id,
            'appointment_date': self.appointment_date.isoformat(),
            'status': self.status
        }

# Favorite model
class Favorite(db.Model):
    __tablename__ = 'favorites'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id
        }

with app.app_context():
    db.create_all()
    user = User.query.filter_by(email='john.doe@example.com').first()
    if user and not user.password.startswith('$2b$'):
        user.password = bcrypt.generate_password_hash('password123').decode('utf-8')
        db.session.commit()
    elif not user:
        sample_user = User(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            password=bcrypt.generate_password_hash('password123').decode('utf-8')
        )
        db.session.add(sample_user)
        db.session.commit()

# Public endpoints (no token required)
@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([doctor.to_dict() for doctor in doctors])

@app.route('/api/doctors/<int:id>', methods=['GET'])
def get_doctor_by_id(id):
    doctor = Doctor.query.get(id)
    if doctor:
        return jsonify(doctor.to_dict())
    return jsonify({'message': 'Doctor not found'}), 404

# Login endpoint (POST)
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Login successful', 'user': user.to_dict(), 'access_token': access_token}), 200
    return jsonify({'message': 'Invalid email or password'}), 401

# Register endpoint (POST)
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    if not all([first_name, last_name, email, password]):
        return jsonify({'message': 'All fields are required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(first_name=first_name, last_name=last_name, email=email, password=hashed_password,is_doctor=False,doctor_id=None)
    db.session.add(new_user)
    db.session.commit()
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({'message': 'Registration successful', 'user': new_user.to_dict(), 'access_token': access_token}), 201

# Protected endpoints (require JWT)
@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def get_appointments():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    appointments = Appointment.query.filter_by(user_id=user_id).all()
    return jsonify([appointment.to_dict() for appointment in appointments])

@app.route('/api/doctor-appointments', methods=['POST'])  # New endpoint
@jwt_required()
def get_doctor_appointments():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    
    # Ensure the logged-in user is a doctor and matches the requested doctor_id
    user = User.query.get(current_user_id)
    if not user or not user.is_doctor or user.doctor_id != doctor_id:
        return jsonify({'message': 'Unauthorized: You can only view your own appointments'}), 403

    appointments = Appointment.query.filter_by(doctor_id=doctor_id).all()
    return jsonify([appointment.to_dict() for appointment in appointments])

@app.route('/api/doctor-available-slots', methods=['POST'])
@jwt_required()
def get_doctor_available_slots():
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    week_start = datetime.strptime(data.get('week_start'), '%Y-%m-%d')  # e.g., "2025-03-03"
    
    if not doctor_id or not week_start:
        return jsonify({'message': 'doctor_id and week_start are required'}), 400

    # Get all appointments for the doctor within the week
    week_end = week_start.replace(hour=23, minute=59, second=59) + timedelta(days=6)
    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date >= week_start,
        Appointment.appointment_date <= week_end
    ).all()

    # Define working hours (8 AM - 5 PM)
    slots = []
    for day_offset in range(7):  # 7 days of the week
        day = week_start + timedelta(days=day_offset)
        for hour in range(8, 18):  # 8 AM to 5 PM
            slot_time = day.replace(hour=hour, minute=0, second=0)
            is_booked = any(
                app.appointment_date.replace(minute=0, second=0) == slot_time  # Directly use datetime object
                for app in appointments
            )
            if not is_booked:
                slots.append({
                    'date': slot_time.isoformat(),
                    'hour': slot_time.strftime('%H:00')
                })

    return jsonify(slots)

@app.route('/api/appointments/book', methods=['POST'])
@jwt_required()
def book_appointment():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    appointment_date = datetime.strptime(data.get('appointment_date'), '%Y-%m-%dT%H:%M:%S')

    if not doctor_id or not appointment_date:
        return jsonify({'message': 'doctor_id and appointment_date are required'}), 400

    user = User.query.get(current_user_id)
    if user.is_doctor and user.doctor_id == doctor_id:
        return jsonify({'message': 'Doctors cannot book their own appointments'}), 403

    if Appointment.query.filter_by(doctor_id=doctor_id, appointment_date=appointment_date).first():
        return jsonify({'message': 'This time slot is already booked'}), 409

    new_appointment = Appointment(
        user_id=current_user_id,
        doctor_id=doctor_id,
        appointment_date=appointment_date,
        status='Pending'
    )
    db.session.add(new_appointment)
    db.session.commit()
    return jsonify({'message': 'Appointment booked successfully', 'appointment': new_appointment.to_dict()}), 201

@app.route('/api/favorites', methods=['POST'])
@jwt_required()
def get_favorites():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    result = []
    for favorite in favorites:
        doctor = Doctor.query.get(favorite.doctor_id)
        if doctor:
            result.append(doctor.to_dict())
    return jsonify(result)

@app.route('/api/profile', methods=['POST'])
@jwt_required()
def get_profile():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    user = User.query.get(user_id)
    if user:
        return jsonify(user.to_dict())
    return jsonify({'message': 'User not found'}), 404

@app.route('/api/favorites/add', methods=['POST'])
@jwt_required()
def add_favorite():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    user_id = data.get('user_id')
    doctor_id = data.get('doctor_id')
    if not user_id or not doctor_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid data'}), 403
    if Favorite.query.filter_by(user_id=user_id, doctor_id=doctor_id).first():
        return jsonify({'message': 'Doctor already favorited'}), 400
    favorite = Favorite(user_id=user_id, doctor_id=doctor_id)
    db.session.add(favorite)
    db.session.commit()
    return jsonify({'message': 'Doctor added to favorites'}), 201

@app.route('/api/favorites/remove', methods=['POST'])
@jwt_required()
def remove_favorite():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    user_id = data.get('user_id')
    doctor_id = data.get('doctor_id')
    if not user_id or not doctor_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid data'}), 403
    favorite = Favorite.query.filter_by(user_id=user_id, doctor_id=doctor_id).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'message': 'Doctor removed from favorites'}), 200
    return jsonify({'message': 'Doctor not found in favorites'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)